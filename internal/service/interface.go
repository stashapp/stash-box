package service

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stashapp/stash-box/internal/queries"
)

// createWithTxnFunc creates a WithTxn function using the provided pgx pool
func createWithTxnFunc(pool *pgxpool.Pool) queries.WithTxnFunc {
	return func(fn func(*queries.Queries) error) (err error) {
		ctx := context.Background()

		// Start a transaction
		tx, err := pool.Begin(ctx)
		if err != nil {
			return err
		}

		// Ensure transaction is properly closed
		defer func() {
			if p := recover(); p != nil {
				// If there was a panic, rollback and re-panic
				_ = tx.Rollback(ctx)
				panic(p)
			} else if err != nil {
				// If there was an error, rollback
				_ = tx.Rollback(ctx)
			} else {
				// If everything was successful, commit
				err = tx.Commit(ctx)
			}
		}()

		// Create Queries object with the transaction
		q := queries.New(tx)

		// Execute the function with the transaction-bound queries
		err = fn(q)
		return err
	}
}
