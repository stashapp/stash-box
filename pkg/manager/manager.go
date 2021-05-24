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
	"github.com/stashapp/stash-box/pkg/email"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/manager/paths"
	"github.com/stashapp/stash-box/pkg/utils"
)

type singleton struct {
	EmailManager *email.Manager
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
			EmailManager: email.NewManager(),
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
Please ensure this database is created and available, or change the connection string in the configuration file, then rerun stash-box.`,
			viper.GetViper().ConfigFileUsed(), config.GetDatabasePath())
		os.Exit(0)
	}

	missingEmail := config.GetMissingEmailSettings()
	if len(missingEmail) > 0 {
		fmt.Printf("%s is set to true, but the following required settings are missing: %s\n", config.RequireActivation, strings.Join(missingEmail, ", "))
	}
}

func initFlags() {
	pflag.IP("host", net.IPv4(0, 0, 0, 0), "ip address for the host")
	pflag.Int("port", 9998, "port to serve from")
	configFilePath = pflag.String("config_file", "", "location of the config file")

	pflag.Parse()
}

func initEnvs() {
	viper.SetEnvPrefix("stash_box") // will be uppercased automatically
	_ = viper.BindEnv("host")       // STASH_BOX_HOST
	_ = viper.BindEnv("port")       // STASH_BOX_PORT
	_ = viper.BindEnv("database")   // STASH_BOX_DATABASE
}

func initLog() {
	logger.Init(config.GetLogFile(), config.GetUserLogFile(), config.GetLogOut(), config.GetLogLevel())
}
