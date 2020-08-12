package manager

import (
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
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
var configFilePath *string

func GetInstance() *singleton {
	Initialize()
	return instance
}

func Initialize() *singleton {
	once.Do(func() {
		initFlags()

		initConfig()
		initLog()
		initEnvs()
		instance = &singleton{
			Status: Idle,
			Paths:  paths.NewPaths(),
			JSON:   &jsonUtils{},
		}
	})

	return instance
}

// returns the path and config name
func parseConfigFilePath() (string, string) {
	dir := filepath.Dir(*configFilePath)
	name := filepath.Base(*configFilePath)
	extension := filepath.Ext(*configFilePath)
	name = strings.TrimSuffix(name, extension)
	return dir, name
}

func initConfig() {
	if *configFilePath != "" {
		dir, name := parseConfigFilePath()
		viper.SetConfigName(name)
		viper.AddConfigPath(dir)
	} else {
		// The config file is called config.  Leave off the file extension.
		viper.SetConfigName(paths.GetConfigName())
		viper.AddConfigPath(".") // Look for config in the working directory
	}

	err := viper.ReadInConfig() // Find and read the config file
	newConfig := false
	if err != nil { // Handle errors reading the config file
		newConfig = true
		defaultConfigFilePath := paths.GetDefaultConfigFilePath()
		if *configFilePath != "" {
			defaultConfigFilePath = *configFilePath
		}

		_ = utils.Touch(defaultConfigFilePath)
		if err = viper.ReadInConfig(); err != nil {
			panic(err)
		}
	}

	if err = config.SetInitialConfig(); err != nil {
		panic(err)
	}

	viper.SetDefault(config.Database, paths.GetDefaultDatabaseFilePath())

	if err := config.Write(); err != nil {
		panic(err)
	}

	if err := viper.BindPFlags(pflag.CommandLine); err != nil {
		logger.Infof("failed to bind flags: %s", err.Error())
	}

	if newConfig {
		fmt.Printf(`
A new config file has been generated at %s.
The database connection string has been defaulted to: %s
Please ensure this database is created and available, or change the connection string in the configuration file, then rerun stashdb.`,
			viper.GetViper().ConfigFileUsed(), config.GetDatabasePath())
		os.Exit(0)
	}
}

func initFlags() {
	pflag.IP("host", net.IPv4(0, 0, 0, 0), "ip address for the host")
	pflag.Int("port", 9998, "port to serve from")
	configFilePath = pflag.String("config_file", "", "location of the config file")

	pflag.Parse()
}

func initEnvs() {
	viper.SetEnvPrefix("stashdb") // will be uppercased automatically
	viper.BindEnv("host")         // STASHDB_HOST
	viper.BindEnv("port")         // STASHDB_PORT
	viper.BindEnv("database")     // STASHDB_DATABASE
}

func initLog() {
	logger.Init(config.GetLogFile(), config.GetLogOut(), config.GetLogLevel())
}
