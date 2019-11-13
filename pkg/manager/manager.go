package manager

import (
	"net"
	"sync"

	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"github.com/stashapp/stashdb/pkg/logger"
	"github.com/stashapp/stashdb/pkg/manager/config"
	"github.com/stashapp/stashdb/pkg/manager/paths"
	"github.com/stashapp/stashdb/pkg/utils"
)

type singleton struct {
	Status JobStatus
	JSON   *jsonUtils
	Paths  *paths.Paths
}

var instance *singleton
var once sync.Once

func GetInstance() *singleton {
	Initialize()
	return instance
}

func Initialize() *singleton {
	once.Do(func() {
		_ = utils.EnsureDir(paths.GetConfigDirectory())
		initConfig()
		initLog()
		initFlags()
		initEnvs()
		instance = &singleton{
			Status: Idle,
			Paths:  paths.NewPaths(),
			JSON:   &jsonUtils{},
		}
	})

	return instance
}

func initConfig() {
	// The config file is called config.  Leave off the file extension.
	viper.SetConfigName(paths.GetConfigName())

	viper.AddConfigPath(".") // Look for config in the working directory

	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		_ = utils.Touch(paths.GetDefaultConfigFilePath())
		if err = viper.ReadInConfig(); err != nil {
			panic(err)
		}

		if err = config.SetInitialConfig(); err != nil {
			panic(err)
		}
	}

	viper.SetDefault(config.Database, paths.GetDefaultDatabaseFilePath())
}

func initFlags() {
	pflag.IP("host", net.IPv4(0, 0, 0, 0), "ip address for the host")
	pflag.Int("port", 9998, "port to serve from")

	pflag.Parse()
	if err := viper.BindPFlags(pflag.CommandLine); err != nil {
		logger.Infof("failed to bind flags: %s", err.Error())
	}
}

func initEnvs() {
	viper.SetEnvPrefix("stash") // will be uppercased automatically
	viper.BindEnv("host")       // STASH_HOST
	viper.BindEnv("port")       // STASH_PORT
	viper.BindEnv("stash")      // STASH_STASH
}

func initLog() {
	logger.Init(config.GetLogFile(), config.GetLogOut(), config.GetLogLevel())
}
