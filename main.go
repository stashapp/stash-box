//go:generate go run github.com/99designs/gqlgen
package main

import (
	"github.com/stashapp/stash-box/pkg/api"
	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/manager"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/sqlx"
	"github.com/stashapp/stash-box/pkg/user"

	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	manager.Initialize()

	const databaseProvider = "postgres"
	db, dialect := database.Initialize(databaseProvider, config.GetDatabasePath())
	txnMgr := sqlx.NewTxnMgr(db, dialect)
	user.CreateRoot(txnMgr.Repo())
	api.Start(txnMgr)
	blockForever()
}

func blockForever() {
	c := make(chan struct{})
	<-c
}
