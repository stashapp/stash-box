//go:generate go run github.com/99designs/gqlgen
package main

import (
	"github.com/stashapp/stash-box/pkg/api"
	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/manager"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/user"

	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	manager.Initialize()

	const databaseProvider = "postgres"
	database.Initialize(databaseProvider, config.GetDatabasePath())
	user.CreateRoot()
	api.Start()
	blockForever()
}

func blockForever() {
	select {}
}
