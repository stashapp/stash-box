//go:generate go run github.com/99designs/gqlgen
package main

import (
	"github.com/stashapp/stash-box/pkg/api"
	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/manager"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/sqlx"
	"github.com/stashapp/stash-box/pkg/user"

	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	manager.Initialize()

	const databaseProvider = "postgres"
	db := database.Initialize(databaseProvider, config.GetDatabasePath())
	txnMgr := sqlx.NewMgr(db)
	fp := &models.RepoFactoryProvider{
		TxnMgr: txnMgr,
	}
	user.CreateRoot(fp.RepoFactory())
	api.Start(fp)
	blockForever()
}

func blockForever() {
	c := make(chan struct{})
	<-c
}
