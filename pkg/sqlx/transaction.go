package sqlx

import (
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/txn"
)

// db is intended as an interface to both sqlx.db and sqlx.Tx, dependent
// on transaction state. Add sqlx.* methods as needed.
type db interface {
	NamedExec(query string, arg interface{}) (sql.Result, error)
	Exec(query string, args ...interface{}) (sql.Result, error)
	Rebind(query string) string
	Get(dest interface{}, query string, args ...interface{}) error
	Select(dest interface{}, query string, args ...interface{}) error
	Queryx(query string, args ...interface{}) (*sqlx.Rows, error)
}

type txnState struct {
	rootDB  *sqlx.DB
	tx      *sqlx.Tx
	dialect Dialect
}

func (m *txnState) WithTxn(fn func() error) (err error) {
	if m.InTxn() {
		err = fn()
		return
	}

	tx, err := m.rootDB.Beginx()
	if err != nil {
		return
	}

	m.tx = tx

	defer func() {
		transaction := m.tx
		m.tx = nil
		//nolint:gocritic
		if p := recover(); p != nil {
			// a panic occurred, rollback and repanic
			_ = transaction.Rollback()
			panic(p)
		} else if err != nil {
			// something went wrong, rollback
			_ = transaction.Rollback()
		} else {
			err = transaction.Commit()
		}
	}()

	err = fn()
	return
}

func (m *txnState) ResetTxn() error {
	if !m.InTxn() {
		return fmt.Errorf("not in transaction")
	}

	if err := m.tx.Rollback(); err != nil {
		return err
	}

	tx, err := m.rootDB.Beginx()
	if err != nil {
		return err
	}

	m.tx = tx
	return nil
}

func (m *txnState) InTxn() bool {
	return m.tx != nil
}

func (m *txnState) DB() db {
	if !m.InTxn() {
		return m.rootDB
	}
	return m.tx
}

// TxnMgr manages transaction boundaries and provides access to Repo objects.
type TxnMgr struct {
	db      *sqlx.DB
	dialect Dialect
}

func (m *TxnMgr) New() txn.State {
	return &txnState{
		rootDB:  m.db,
		dialect: m.dialect,
	}
}

// Repo creates a new TxnState object and initialises the Repo
// with it.
func (m *TxnMgr) Repo() models.Repo {
	return &repo{
		txnState: m.New().(*txnState),
	}
}

// NewTxnMgr returns a new instance of TxnMgr.
func NewTxnMgr(db *sqlx.DB, dialect Dialect) *TxnMgr {
	return &TxnMgr{
		db:      db,
		dialect: dialect,
	}
}
