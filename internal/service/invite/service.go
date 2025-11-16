package invite

import (
	"context"

	"github.com/stashapp/stash-box/internal/queries"
)

type Invite struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

func NewInvite(queries *queries.Queries, withTxn queries.WithTxnFunc) *Invite {
	return &Invite{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Invite) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

func (s *Invite) DestroyExpired(ctx context.Context) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return tx.DestroyExpiredInvites(ctx)
	})
}
