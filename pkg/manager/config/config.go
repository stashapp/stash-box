package config

import (
	"crypto/rand"
	"fmt"

	"github.com/spf13/viper"
)

const Stash = "stash"
const Metadata = "metadata"

const Database = "database"

const Host = "host"
const Port = "port"

// TODO - temporary api key configuration
const ReadApiKey = "read_api_key"
const ModifyApiKey = "modify_api_key"

// Logging options
const LogFile = "logFile"
const LogOut = "logOut"
const LogLevel = "logLevel"

func Set(key string, value interface{}) {
	viper.Set(key, value)
}

func Write() error {
	return viper.WriteConfig()
}

func GetMetadataPath() string {
	return viper.GetString(Metadata)
}

func GetDatabasePath() string {
	return viper.GetString(Database)
}

func GetHost() string {
	return viper.GetString(Host)
}

func GetPort() int {
	return viper.GetInt(Port)
}

func GetReadApiKey() string {
	return viper.GetString(ReadApiKey)
}

func GetModifyApiKey() string {
	return viper.GetString(ModifyApiKey)
}

// GetLogFile returns the filename of the file to output logs to.
// An empty string means that file logging will be disabled.
func GetLogFile() string {
	return viper.GetString(LogFile)
}

// GetLogOut returns true if logging should be output to the terminal
// in addition to writing to a log file. Logging will be output to the
// terminal if file logging is disabled. Defaults to true.
func GetLogOut() bool {
	ret := true
	if viper.IsSet(LogOut) {
		ret = viper.GetBool(LogOut)
	}

	return ret
}

// GetLogLevel returns the lowest log level to write to the log.
// Should be one of "Debug", "Info", "Warning", "Error"
func GetLogLevel() string {
	const defaultValue = "Info"

	value := viper.GetString(LogLevel)
	if value != "Debug" && value != "Info" && value != "Warning" && value != "Error" {
		value = defaultValue
	}

	return value
}

func IsValid() bool {
	setPaths := viper.IsSet(Stash) && viper.IsSet(Metadata)

	// TODO: check valid paths
	return setPaths
}

func generateApiKey() string {
	const apiKeyLength = 32
	b := make([]byte, apiKeyLength)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}

func SetInitialConfig() error {
	// generate some api keys
	rApiKey := generateApiKey()
	wApiKey := generateApiKey()

	Set(ReadApiKey, rApiKey)
	Set(ModifyApiKey, wApiKey)
	return Write()
}
