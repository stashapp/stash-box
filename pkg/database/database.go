package database

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

var appSchemaVersion uint = 49

var databaseProviders map[string]databaseProvider

type databaseProvider interface {
	Open(path string) *pgxpool.Pool
}

func Initialize(provider string, databasePath string) *pgxpool.Pool {
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
