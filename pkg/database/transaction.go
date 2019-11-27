package database

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type Transaction interface {
	Begin(ctx context.Context) *sqlx.Tx
	Commit() error
	Rollback() error
	GetTx() *sqlx.Tx
}

type transaction struct {
	tx     *sqlx.Tx
	closed bool
}

func NewTransaction(ctx context.Context) Transaction {
	return &transaction{}
}

func (t *transaction) close() {
	t.closed = true
}

func (t *transaction) Begin(ctx context.Context) *sqlx.Tx {
	if t.tx != nil {
		panic("Begin called twice on the same Transaction")
	}

	if t.closed {
		panic("Begin called on closed Transaction")
	}

	t.tx = DB.MustBeginTx(ctx, nil)
	return t.tx
}

func (t *transaction) Commit() error {
	if t.closed {
		panic("Commit called on closed transaction")
	}

	if t.tx == nil {
		panic("Commit called before Begin")
	}

	defer t.close()

	return t.tx.Commit()
}

func (t *transaction) Rollback() error {
	if t.tx == nil {
		panic("Rollback called before begin")
	}

	defer t.close()

	return t.tx.Rollback()
}

func (t *transaction) GetTx() *sqlx.Tx {
	return t.tx
}

type TxFunc func(Transaction) error

func WithTransaction(ctx context.Context, fn TxFunc) error {
	txn := NewTransaction(ctx)
	txn.Begin(ctx)

	var err error
	defer func() {
		if p := recover(); p != nil {
			// a panic occurred, rollback and repanic
			txn.Rollback()
			panic(p)
		} else if err != nil {
			// something went wrong, rollback
			txn.Rollback()
		} else {
			// all good, commit
			err = txn.Commit()
		}
	}()

	err = fn(txn)
	return err
}
