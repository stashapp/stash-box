package main

import (
	"context"
	"net"

	"github.com/spf13/pflag"
	"github.com/stashapp/stash-box/frontend"
	"github.com/stashapp/stash-box/internal/api"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/cron"
	"github.com/stashapp/stash-box/internal/database"
	"github.com/stashapp/stash-box/internal/email"
	"github.com/stashapp/stash-box/internal/image"
	"github.com/stashapp/stash-box/internal/service"
	"github.com/stashapp/stash-box/pkg/logger"
)

func main() {
	// Initialize flags
	pflag.IP("host", net.IPv4(0, 0, 0, 0), "ip address for the host")
	pflag.Int("port", 9998, "port to serve from")
	configFilePath := pflag.String("config_file", "", "location of the config file")
	pflag.Parse()

	// Initialize config
	initConfig(configFilePath)

	// Initialize logger
	logger.Init(config.GetLogFile(), config.GetUserLogFile(), config.GetLogOut(), config.GetLogLevel())

	cleanup := logger.InitTracer()
	//nolint:errcheck
	defer cleanup(context.Background())

	api.InitializeSession()

	// Create email manager
	emailMgr := email.NewManager()

	db := database.Initialize(config.GetDatabasePath())
	fac := service.NewFactory(db, emailMgr)
	fac.User().CreateSystemUsers(context.Background())
	api.Start(*fac, frontend.FS)
	cron.Init(*fac)

	image.InitResizer()

	blockForever()
}

func blockForever() {
	c := make(chan struct{})
	<-c
}
