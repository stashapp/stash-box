package database

import (
	"database/sql"
	"fmt"
	"regexp"

	"github.com/gobuffalo/packr/v2"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source"
	"github.com/jmoiron/sqlx"
	sqlite3 "github.com/mattn/go-sqlite3"
	"github.com/stashapp/stashdb/pkg/logger"
	"github.com/stashapp/stashdb/pkg/utils"
)

const sqlite3Driver = "sqlite3_regexp"

func init() {
	// register custom driver with regexp function
	registerRegexpFunc()

	registerProvider("sqlite3", &SQLite3Provider{})
}

type SQLite3Provider struct{}

func (p *SQLite3Provider) Open(databasePath string) *sqlx.DB {
	p.runMigrations(databasePath)

	// https://github.com/mattn/go-sqlite3
	conn, err := sqlx.Open(sqlite3Driver, "file:"+databasePath+"?_fk=true")
	conn.SetMaxOpenConns(25)
	conn.SetMaxIdleConns(4)
	if err != nil {
		logger.Fatalf("db.Open(): %q\n", err)
	}
	return conn
}

// Migrate the database
func (p *SQLite3Provider) runMigrations(databasePath string) {
	migrationsBox := packr.New("sqlite3 Migrations", "./migrations/sqlite3")
	packrSource := &Packr2Source{
		Box:        migrationsBox,
		Migrations: source.NewMigrations(),
	}

	databasePath = utils.FixWindowsPath(databasePath)
	s, _ := WithInstance(packrSource)
	m, err := migrate.NewWithSourceInstance(
		"packr2",
		s,
		fmt.Sprintf("sqlite3://%s", databasePath),
	)
	if err != nil {
		panic(err.Error())
	}

	databaseSchemaVersion, _, _ := m.Version()
	stepNumber := appSchemaVersion - databaseSchemaVersion
	if stepNumber != 0 {
		err = m.Steps(int(stepNumber))
		if err != nil {
			panic(err.Error())
		}
	}

	m.Close()
}

func registerRegexpFunc() {
	regexFn := func(re, s string) (bool, error) {
		return regexp.MatchString(re, s)
	}

	sql.Register(sqlite3Driver,
		&sqlite3.SQLiteDriver{
			ConnectHook: func(conn *sqlite3.SQLiteConn) error {
				return conn.RegisterFunc("regexp", regexFn, true)
			},
		})
}

type sqlite3Dialect struct{}

func (p *SQLite3Provider) GetDialect() sqlDialect {
	return &sqlite3Dialect{}
}

func (*sqlite3Dialect) FieldQuote(field string) string {
	return "`" + field + "`"
}

func (*sqlite3Dialect) SetPlaceholders(sql string) string {
	return sql
}

func (*sqlite3Dialect) NullsLast() string {
	// TODO - determine a workaround for NULLS LAST support
	return " "
}
