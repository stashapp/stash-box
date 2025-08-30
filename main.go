//go:generate go run github.com/99designs/gqlgen
package main

import (
	"context"
	"embed"

	"github.com/stashapp/stash-box/internal/cron"
	"github.com/stashapp/stash-box/internal/service"
	"github.com/stashapp/stash-box/pkg/api"
	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager"
	"github.com/stashapp/stash-box/pkg/manager/config"
)

//go:embed frontend/build
var ui embed.FS

func main() {
	manager.Initialize()

	cleanup := logger.InitTracer()
	//nolint:errcheck
	defer cleanup(context.Background())

	api.InitializeSession()

	const databaseProvider = "postgres"
	db := database.Initialize(databaseProvider, config.GetDatabasePath())
	fac := service.NewFactory(db)
	fac.User().CreateSystemUsers(context.Background())
	api.Start(*fac, ui)
	cron.Init(*fac)

	image.InitResizer()

	blockForever()
}

func blockForever() {
	c := make(chan struct{})
	<-c
}
