package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/utils"
)

func initConfig(configFilePath *string) {
	if *configFilePath != "" {
		dir, name := parseConfigFilePath(*configFilePath)
		viper.SetConfigName(name)
		viper.AddConfigPath(dir)
	} else {
		viper.SetConfigName(config.GetConfigName())
		viper.AddConfigPath(".")
	}

	err := viper.ReadInConfig()
	newConfig := false
	if err != nil {
		newConfig = true
		defaultConfigFilePath := config.GetDefaultConfigFilePath()
		if *configFilePath != "" {
			defaultConfigFilePath = *configFilePath
		}

		_ = utils.Touch(defaultConfigFilePath)
		if err = viper.ReadInConfig(); err != nil {
			panic(err)
		}
	}

	if err = config.InitializeDefaults(); err != nil {
		panic(err)
	}

	initEnvs()

	if err = viper.ReadInConfig(); err != nil {
		panic(err)
	}

	if err := viper.BindPFlags(pflag.CommandLine); err != nil {
		logger.Infof("failed to bind flags: %s", err.Error())
	}

	if err = config.Initialize(); err != nil {
		panic(err)
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
		fmt.Printf("RequireActivation is set to true, but the following required settings are missing: %s\n", strings.Join(missingEmail, ", "))
	}
}

func parseConfigFilePath(configFilePath string) (string, string) {
	dir := filepath.Dir(configFilePath)
	name := filepath.Base(configFilePath)
	extension := filepath.Ext(configFilePath)
	name = strings.TrimSuffix(name, extension)
	return dir, name
}

func initEnvs() {
	viper.SetEnvPrefix("stash_box")
	viper.AutomaticEnv()
	_ = viper.BindEnv("host")
	_ = viper.BindEnv("port")
	_ = viper.BindEnv("database")
}
