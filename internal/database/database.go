package database

import (
	"context"
	"embed"
	"fmt"
	"strings"
	"time"

	"github.com/exaring/otelpgx"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/pkg/logger"

	// Register pgx stdlib driver and postgres migrate driver
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/jackc/pgx/v5/stdlib"
)

const (
	postgresDriver = "postgres"
	schemaVersion  = 50
)

//go:embed migrations/postgres/*.sql
var migrationsFS embed.FS

// extractSQLCQueryName extracts the query name from sqlc-generated SQL comments
// sqlc embeds query names as comments like: "-- name: GetUser :one"
// For non-sqlc queries, returns the full query (otelpgx default behavior)
func extractSQLCQueryName(query string) string {
	// Check if the query starts with a sqlc name comment
	if strings.HasPrefix(query, "-- name:") {
		parts := strings.Fields(query)
		if len(parts) > 2 {
			return parts[2] // Return the query name (e.g., "GetUser")
		}
	}
	return query // Fallback to full query for non-sqlc queries (default otelpgx behavior)
}

// Initialize opens a PostgreSQL connection pool and runs migrations
func Initialize(databasePath string) *pgxpool.Pool {
	runMigrations(databasePath)

	// Parse connection string into pgxpool config
	poolConfig, err := pgxpool.ParseConfig("postgres://" + databasePath)
	if err != nil {
		logger.Fatalf("Failed to parse pgxpool config: %q\n", err)
	}

	// Set connection pool configuration
	poolConfig.MaxConns = int32(config.GetMaxOpenConns())
	poolConfig.MinConns = int32(config.GetMaxIdleConns())
	poolConfig.MaxConnLifetime = time.Duration(config.GetConnMaxLifetime()) * time.Minute

	// Add otelpgx tracing with custom span name function to use sqlc query names
	poolConfig.ConnConfig.Tracer = otelpgx.NewTracer(
		otelpgx.WithSpanNameFunc(extractSQLCQueryName),
	)

	// Create connection pool
	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		logger.Fatalf("Failed to create pgxpool: %q\n", err)
	}

	return pool
}

// runMigrations runs database migrations
func runMigrations(databasePath string) {
	migrations, err := iofs.New(migrationsFS, "migrations/postgres")
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
	stepNumber := schemaVersion - databaseSchemaVersion
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
func (*migrateLogger) Printf(format string, v ...any) {
	logger.Debugf("Migration: "+format, v...)
}

// Verbose should return true when verbose logging output is wanted
func (*migrateLogger) Verbose() bool {
	return true
}
