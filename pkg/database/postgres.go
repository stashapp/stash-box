package database

import (
	"context"
	"embed"
	"fmt"
	"time"

	"github.com/exaring/otelpgx"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager/config"

	// Register pgx stdlib driver and postgres migrate driver
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/jackc/pgx/v5/stdlib"
)

const postgresDriver = "postgres"

//go:embed migrations/postgres/*.sql
var fs embed.FS

func init() {
	registerProvider("postgres", &PostgresProvider{})
}

type PostgresProvider struct{}

func (p *PostgresProvider) Open(databasePath string) *pgxpool.Pool {
	p.runMigrations(databasePath)

	// Parse connection string into pgxpool config
	poolConfig, err := pgxpool.ParseConfig("postgres://" + databasePath)
	if err != nil {
		logger.Fatalf("Failed to parse pgxpool config: %q\n", err)
	}

	// Set connection pool configuration
	poolConfig.MaxConns = int32(config.GetMaxOpenConns())
	poolConfig.MinConns = int32(config.GetMaxIdleConns())
	poolConfig.MaxConnLifetime = time.Duration(config.GetConnMaxLifetime()) * time.Minute

	// Add otelpgx tracing
	poolConfig.ConnConfig.Tracer = otelpgx.NewTracer()

	// Create connection pool
	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		logger.Fatalf("Failed to create pgxpool: %q\n", err)
	}

	return pool
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
