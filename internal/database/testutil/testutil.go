package testutil

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/stashapp/stash-box/internal/database"
	"github.com/stashapp/stash-box/internal/service"
)

var (
	db      *pgxpool.Pool
	factory *service.Factory
)

const defaultTestDB = "postgres@localhost/stash-box-test?sslmode=disable"

type DatabasePopulater interface {
	PopulateDB(factory *service.Factory) error
}

func pgDropAll(conn *pgxpool.Pool) {
	// we want to drop all tables so that the migration initialises
	// the schema
	rows, err := conn.Query(context.TODO(), `select 'drop table if exists "' || tablename || '" cascade;' from pg_tables`)

	if err != nil {
		panic("Error dropping tables: " + err.Error())
	}
	defer rows.Close()

	for rows.Next() {
		var stmt string
		if err := rows.Scan(&stmt); err != nil {
			panic("Error dropping tables: " + err.Error())
		}

		_, _ = conn.Exec(context.TODO(), stmt)
	}
}

func initPostgres(connString string) func() {
	conn, err := pgxpool.New(context.TODO(), "postgres://"+connString)

	if err != nil {
		panic(fmt.Sprintf("Could not connect to postgres database at %s: %s", connString, err.Error()))
	}

	pgDropAll(conn)
	conn.Close()

	db = database.Initialize(connString)
	factory = service.NewFactory(db, nil) // nil EmailManager is fine for tests

	// Create system users (root, StashBot, etc.) just like main.go does
	factory.User().CreateSystemUsers(context.TODO())

	return teardownPostgres
}

func teardownPostgres() {
	noDrop := os.Getenv("POSTGRES_NODROP")
	if noDrop == "" {
		pgDropAll(db)
	}
	db.Close()
}

func runTests(m *testing.M, populater DatabasePopulater) int {
	var deferFn func()

	pgConnStr := os.Getenv("POSTGRES_DB")
	if pgConnStr == "" {
		pgConnStr = defaultTestDB
	}
	deferFn = initPostgres(pgConnStr)
	// defer close and delete the database
	if deferFn != nil {
		defer deferFn()
	}

	if populater != nil {
		err := populater.PopulateDB(factory)
		if err != nil {
			panic(fmt.Sprintf("Could not populate database: %s", err.Error()))
		}
	}

	// run the tests
	return m.Run()
}

func TestWithDatabase(m *testing.M, populater DatabasePopulater) {
	ret := runTests(m, populater)
	os.Exit(ret)
}

func Factory() *service.Factory {
	return factory
}
