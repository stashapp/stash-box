package txn

import (
	"database/sql"

	"github.com/jmoiron/sqlx"
)

type DB interface{}

type TxnMgr struct {
	rootDB *sqlx.DB
	tx     *sql.Tx
}

func NewMgr(db *sqlx.DB) *TxnMgr {
	return &TxnMgr{
		rootDB: db,
	}
}

func (m *TxnMgr) WithTxn(fn func() error) (txErr error) {
	if !m.InTxn() {
		tx, err := m.rootDB.Begin()
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
		return m.DB
	}

	return m.tx
}
