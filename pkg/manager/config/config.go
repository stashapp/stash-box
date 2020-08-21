package config

import (
	"github.com/spf13/viper"

	"github.com/stashapp/stashdb/pkg/utils"
)

const Stash = "stash"
const Metadata = "metadata"

const Database = "database"

const Host = "host"
const Port = "port"
const HTTPUpgrade = "http_upgrade"
const IsProduction = "is_production"

// key used to sign JWT tokens
const JWTSignKey = "jwt_secret_key"

// key used for session store
const SessionStoreKey = "session_store_key"

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

func GetJWTSignKey() []byte {
	return []byte(viper.GetString(JWTSignKey))
}

func GetSessionStoreKey() []byte {
	return []byte(viper.GetString(SessionStoreKey))
}

func GetHTTPUpgrade() bool {
	return viper.GetBool(HTTPUpgrade)
}

func GetIsProduction() bool {
	ret := false
	if viper.IsSet(IsProduction) {
		ret = viper.GetBool(IsProduction)
	}

	return ret
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

// SetInitialConfig fills in missing required config fields
func SetInitialConfig() error {
	// generate some api keys
	const apiKeyLength = 32

	if string(GetJWTSignKey()) == "" {
		signKey := utils.GenerateRandomKey(apiKeyLength)
		Set(JWTSignKey, signKey)
	}

	if string(GetSessionStoreKey()) == "" {
		sessionStoreKey := utils.GenerateRandomKey(apiKeyLength)
		Set(SessionStoreKey, sessionStoreKey)
	}

	return Write()
}
