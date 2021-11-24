package database

import (
	"embed"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/logger"

	// Driver used here only
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/lib/pq"
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

	conn, err := sqlx.Open(postgresDriver, "postgres://"+databasePath)
	conn.SetMaxOpenConns(25)
	conn.SetMaxIdleConns(4)
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
