//go:generate go run github.com/99designs/gqlgen
package main

import (
	"context"
	"embed"

	"github.com/stashapp/stash-box/pkg/api"
	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/manager/cron"
	"github.com/stashapp/stash-box/pkg/sqlx"
	"github.com/stashapp/stash-box/pkg/user"
)

// nolint
//
//go:embed frontend/build
var ui embed.FS

func main() {
	cleanup := logger.InitTracer()
	//nolint:errcheck
	defer cleanup(context.Background())

	manager.Initialize()
	api.InitializeSession()

	const databaseProvider = "postgres"
	db := database.Initialize(databaseProvider, config.GetDatabasePath())
	txnMgr := sqlx.NewTxnMgr(db)
	user.CreateSystemUsers(txnMgr.Repo(context.Background()))
	api.Start(txnMgr, ui)
	cron.Init(txnMgr)
	blockForever()
}

func blockForever() {
	c := make(chan struct{})
	<-c
}
