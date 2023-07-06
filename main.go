//go:generate go run github.com/99designs/gqlgen
package main

import (
	"embed"

	"github.com/stashapp/stash-box/pkg/api"
	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/image"
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
	manager.Initialize()

	const databaseProvider = "postgres"
	db := database.Initialize(databaseProvider, config.GetDatabasePath())
	txnMgr := sqlx.NewTxnMgr(db)
	user.CreateSystemUsers(txnMgr.Repo())
	api.Start(txnMgr, ui)
	cron.Init(txnMgr)

	image.InitResizer()

	blockForever()
}

func blockForever() {
	c := make(chan struct{})
	<-c
}
