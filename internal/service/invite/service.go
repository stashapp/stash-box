package invite

import (
	"context"

	"github.com/stashapp/stash-box/internal/db"
)

type Invite struct {
	queries *db.Queries
	withTxn db.WithTxnFunc
}

func NewInvite(queries *db.Queries, withTxn db.WithTxnFunc) *Invite {
	return &Invite{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Invite) WithTxn(fn func(*db.Queries) error) error {
	return s.withTxn(fn)
}

func (s *Invite) DestroyExpired(ctx context.Context) error {
	return s.withTxn(func(tx *db.Queries) error {
		return tx.DestroyExpiredInvites(ctx)
	})
}
