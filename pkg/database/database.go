package database

import (
	"github.com/jmoiron/sqlx"
)

var DB *sqlx.DB

var appSchemaVersion uint = 1
var databaseProviders map[string]databaseProvider
var dialect sqlDialect

type sqlDialect interface {
	FieldQuote(field string) string
	NullsLast() string
}

type databaseProvider interface {
	Open(path string) *sqlx.DB
	GetDialect() sqlDialect
}

func Initialize(provider string, databasePath string) {
	p := databaseProviders[provider]

	if p == nil {
		panic("No database provider found for " + provider)
	}

	DB = p.Open(databasePath)
	dialect = p.GetDialect()
}

func GetDialect() sqlDialect {
	return dialect
}

func registerProvider(name string, provider databaseProvider) {
	if databaseProviders == nil {
		databaseProviders = make(map[string]databaseProvider)
	}
	databaseProviders[name] = provider
}
