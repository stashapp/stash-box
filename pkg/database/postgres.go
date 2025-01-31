package database

import (
	"database/sql"
	"embed"
	"fmt"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager/config"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"

	// Driver used here only
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/lib/pq"
	"go.nhat.io/otelsql"
)

const postgresDriver = "postgres"

//go:embed migrations/postgres/*.sql
var fs embed.FS

func init() {
	registerProvider("postgres", &PostgresProvider{})
}

type PostgresProvider struct{}

func (p *PostgresProvider) Open(databasePath string) *sqlx.DB {
	p.runMigrations(databasePath)

	driverName, err := otelsql.Register("postgres",
		otelsql.TraceQueryWithoutArgs(),
		otelsql.WithSystem(semconv.DBSystemPostgreSQL),
	)

	if err != nil {
		logger.Fatalf("db.Open(): %q\n", err)
	}

	db, err := sql.Open(driverName, "postgres://"+databasePath)
	if err != nil {
		logger.Fatalf("db.Open(): %q\n", err)
	}

	if err := otelsql.RecordStats(db); err != nil {
		logger.Fatalf("db.Open(): %q\n", err)
	}

	conn := sqlx.NewDb(db, "postgres")
	conn.SetMaxOpenConns(config.GetMaxOpenConns())
	conn.SetMaxIdleConns(config.GetMaxIdleConns())
	conn.SetConnMaxLifetime(time.Duration(config.GetConnMaxLifetime()) * time.Minute)
	if err != nil {
		logger.Fatalf("db.Open(): %q\n", err)
	}
	return conn
}

// Migrate the database
func (p *PostgresProvider) runMigrations(databasePath string) {
	migrations, err := iofs.New(fs, "migrations/postgres")
	if err != nil {
		panic(err.Error())
	}

	m, err := migrate.NewWithSourceInstance(
		"iofs",
		migrations,
		fmt.Sprintf("%s://%s", postgresDriver, databasePath),
	)
	if err != nil {
		panic(err.Error())
	}

	m.Log = &migrateLogger{}

	databaseSchemaVersion, _, _ := m.Version()
	stepNumber := appSchemaVersion - databaseSchemaVersion
	if stepNumber != 0 {
		err = m.Steps(int(stepNumber))
		if err != nil {
			panic(err.Error())
		}
	}

	_, _ = m.Close()
}

type migrateLogger struct {
	migrate.Logger
}

// Printf is like fmt.Printf
func (*migrateLogger) Printf(format string, v ...interface{}) {
	logger.Debugf("Migration: "+format, v...)
}

// Verbose should return true when verbose logging output is wanted
func (*migrateLogger) Verbose() bool {
	return true
}
