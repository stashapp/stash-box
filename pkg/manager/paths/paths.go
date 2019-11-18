package paths

import (
	"path/filepath"
)

type Paths struct {
	JSON *jsonPaths
}

func NewPaths() *Paths {
	p := Paths{}
	p.JSON = newJSONPaths()
	return &p
}

func GetConfigDirectory() string {
	return "."
}

func GetDefaultDatabaseFilePath() string {
	return filepath.Join(GetConfigDirectory(), "stashdb-go.sqlite")
}

func GetConfigName() string {
	return "stashdb-config"
}

func GetDefaultConfigFilePath() string {
	return filepath.Join(GetConfigDirectory(), GetConfigName()+".yml")
}

func GetSSLKey() string {
	return filepath.Join(GetConfigDirectory(), "stashdb.key")
}

func GetSSLCert() string {
	return filepath.Join(GetConfigDirectory(), "stashdb.crt")
}
