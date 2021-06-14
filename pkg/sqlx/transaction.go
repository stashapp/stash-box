package sqlx

import (
	"database/sql"

	"github.com/jmoiron/sqlx"
)

type DB interface {
	NamedExec(query string, arg interface{}) (sql.Result, error)
	Exec(query string, args ...interface{}) (sql.Result, error)
	Rebind(query string) string
	Get(dest interface{}, query string, args ...interface{}) error
	Queryx(query string, args ...interface{}) (*sqlx.Rows, error)
}

type Rows struct{ sqlx.Rows }

type TxnMgr struct {
	rootDB *sqlx.DB
	tx     *sqlx.Tx
}

func NewMgr(db *sqlx.DB) *TxnMgr {
	return &TxnMgr{
		rootDB: db,
	}
}

func (m *TxnMgr) WithTxn(fn func() error) (txErr error) {
	if !m.InTxn() {
		tx, err := m.rootDB.Beginx()
		if err != nil {
			return err
		}

		m.tx = tx

		var txErr error
		defer func() {
			m.tx = nil
			if txErr != nil {
				tx.Rollback()
			} else {
				txErr = tx.Commit()
			}
		}()

		return fn()
	}

	return fn()
}

func (m *TxnMgr) InTxn() bool {
	return m.tx != nil
}

func (m *TxnMgr) DB() DB {
	if m.InTxn() {
		return m.rootDB
	}
	return m.tx
}

// TODO - temporary workaround
func In(query string, args ...interface{}) (string, []interface{}, error) {
	return sqlx.In(query, args...)
}

func Named(query string, arg interface{}) (string, []interface{}, error) {
	return sqlx.Named(query, arg)
}
