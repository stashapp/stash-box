package database

import (
	"github.com/jmoiron/sqlx"
)

var DB *sqlx.DB
var appSchemaVersion uint = 1
var databaseProviders map[string]databaseProvider

type databaseProvider interface {
	Open(path string) *sqlx.DB
}

func Initialize(provider string, databasePath string) {
	p := databaseProviders[provider]

	if p == nil {
		panic("No database provider found for " + provider)
	}

	DB = p.Open(databasePath)
}

func registerProvider(name string, provider databaseProvider) {
	if databaseProviders == nil {
		databaseProviders = make(map[string]databaseProvider)
	}
	databaseProviders[name] = provider
}
