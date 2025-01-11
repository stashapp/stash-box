package database

import (
	"github.com/jmoiron/sqlx"
)

var appSchemaVersion uint = 48

var databaseProviders map[string]databaseProvider

type databaseProvider interface {
	Open(path string) *sqlx.DB
}

func Initialize(provider string, databasePath string) *sqlx.DB {
	p := databaseProviders[provider]

	if p == nil {
		panic("No database provider found for " + provider)
	}

	db := p.Open(databasePath)
	return db
}

func registerProvider(name string, provider databaseProvider) {
	if databaseProviders == nil {
		databaseProviders = make(map[string]databaseProvider)
	}
	databaseProviders[name] = provider
}
