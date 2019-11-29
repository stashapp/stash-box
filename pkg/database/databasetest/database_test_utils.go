package databasetest

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"testing"

	"github.com/stashapp/stashdb/pkg/database"
)

type DatabasePopulater interface {
	PopulateDB() error
}

func testTeardown(databaseFile string) {
	err := database.DB.Close()

	if err != nil {
		panic(err)
	}

	err = os.Remove(databaseFile)
	if err != nil {
		panic(err)
	}
}

func runTests(m *testing.M, populater DatabasePopulater) int {
	// create the database file
	f, err := ioutil.TempFile("", "*.sqlite")
	if err != nil {
		panic(fmt.Sprintf("Could not create temporary file: %s", err.Error()))
	}

	f.Close()
	databaseFile := f.Name()
	const databaseType = "sqlite3"
	database.Initialize(databaseType, databaseFile)

	// defer close and delete the database
	defer testTeardown(databaseFile)

	if populater != nil {
		err = populater.PopulateDB()
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

func WithTransientTransaction(ctx context.Context, fn database.TxFunc) {
	txn := database.NewTransaction(ctx)
	txn.Begin(ctx)

	defer func() {
		if p := recover(); p != nil {
			// a panic occurred, rollback and repanic
			txn.Rollback()
			panic(p)
		} else {
			// something went wrong, rollback
			txn.Rollback()
		}
	}()

	fn(txn)
}
