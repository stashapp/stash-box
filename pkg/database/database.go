package database

import (
	"github.com/jmoiron/sqlx"
	sqlxx "github.com/stashapp/stash-box/pkg/sqlx"
)

var DB *sqlx.DB

var appSchemaVersion uint = 15
var databaseProviders map[string]databaseProvider
var dialect sqlxx.Dialect

type sqlDialect interface {
	FieldQuote(field string) string
	NullsLast() string
}

type databaseProvider interface {
	Open(path string) *sqlx.DB
	GetDialect() sqlxx.Dialect
}

func Initialize(provider string, databasePath string) (*sqlx.DB, sqlxx.Dialect) {
	p := databaseProviders[provider]

	if p == nil {
		panic("No database provider found for " + provider)
	}

	DB = p.Open(databasePath)
	dialect = p.GetDialect()
	return DB, dialect
}

func GetDialect() sqlxx.Dialect {
	return dialect
}

func registerProvider(name string, provider databaseProvider) {
	if databaseProviders == nil {
		databaseProviders = make(map[string]databaseProvider)
	}
	databaseProviders[name] = provider
}
