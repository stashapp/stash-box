package databasetest

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"testing"

	"github.com/jmoiron/sqlx"

	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/manager/notifications"
	"github.com/stashapp/stash-box/pkg/models"
	sqlxx "github.com/stashapp/stash-box/pkg/sqlx"
)

var (
	db   *sqlx.DB
	repo models.Repo
)

const defaultTestDB = "postgres@localhost/stash-box-test?sslmode=disable"

type DatabasePopulater interface {
	PopulateDB(repo models.Repo) error
}

func pgDropAll(conn *sqlx.DB) {
	// we want to drop all tables so that the migration initialises
	// the schema
	rows, err := conn.Queryx(`select 'drop table if exists "' || tablename || '" cascade;' from pg_tables`)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		panic("Error dropping tables: " + err.Error())
	}
	defer func() {
		_ = rows.Close()
	}()

	for rows.Next() {
		var stmt string
		if err := rows.Scan(&stmt); err != nil {
			panic("Error dropping tables: " + err.Error())
		}

		_, _ = conn.Exec(stmt)
	}
}

func initPostgres(connString string) func() {
	const databaseType = "postgres"
	conn, err := sqlx.Open(databaseType, "postgres://"+connString)

	if err != nil {
		panic(fmt.Sprintf("Could not connect to postgres database at %s: %s", connString, err.Error()))
	}

	pgDropAll(conn)

	db = database.Initialize(databaseType, connString)
	txnMgr := sqlxx.NewTxnMgr(db)
	notifications.Init(txnMgr)
	repo = txnMgr.Repo(context.TODO())

	return teardownPostgres
}

func teardownPostgres() {
	noDrop := os.Getenv("POSTGRES_NODROP")
	if noDrop == "" {
		pgDropAll(db)
	}
	_ = db.Close()
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
		err := populater.PopulateDB(repo)
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

func Repo() models.Repo {
	return repo
}
