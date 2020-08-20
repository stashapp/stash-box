//go:generate go run github.com/99designs/gqlgen
package main

import (
	"github.com/stashapp/stashdb/pkg/api"
	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/manager"
	"github.com/stashapp/stashdb/pkg/manager/config"

	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	manager.Initialize()

	const databaseProvider = "postgres"
	database.Initialize(databaseProvider, config.GetDatabasePath())
	manager.CreateRootUser()
	api.Start()
	blockForever()
}

func blockForever() {
	select {}
}
