package user

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

var ErrNoInviteTokens = errors.New("no invite tokens available")
var ErrInviteKeyAlreadyUsed = errors.New("invite key has already been used and cannot be rescinded")

type Finder interface {
	Find(id uuid.UUID) (*models.User, error)
}

type FinderUpdater interface {
	Finder
	UpdateFull(updatedUser models.User) (*models.User, error)
}

// GrantInviteTokens increments the invite token count for a user by up to 10.
func grantInviteTokens(ctx context.Context, tx *queries.Queries, userID uuid.UUID, tokens int) (int, error) {
	u, err := tx.FindUser(ctx, userID)

	if err != nil {
		return 0, err
	}

	// don't accept negative numbers
	if tokens < 0 {
		return int(u.InviteTokens), nil
	}

	// put a sensible limit on the number of tokens that can be granted at a time
	const maxTokens = 10
	if tokens > maxTokens {
		tokens = maxTokens
	}

	u.InviteTokens += tokens

	err = tx.UpdateUserInviteTokenCount(ctx, queries.UpdateUserInviteTokenCountParams{
		ID:           u.ID,
		InviteTokens: u.InviteTokens,
	})

	return int(u.InviteTokens), err
}

// RepealInviteTokens decrements a user's invite token count by the provided
// amount. Invite tokens are constrained to a minimum of 0.
func repealInviteTokens(ctx context.Context, tx *queries.Queries, userID uuid.UUID, tokens int) (int, error) {
	u, err := tx.FindUser(ctx, userID)

	if err != nil {
		return 0, err
	}

	// don't accept negative numbers
	if tokens < 0 {
		return int(u.InviteTokens), nil
	}

	// no limit on the tokens to repeal
	u.InviteTokens -= tokens

	// don't allow to go negative
	if u.InviteTokens < 0 {
		u.InviteTokens = 0
	}

	err = tx.UpdateUserInviteTokenCount(ctx, queries.UpdateUserInviteTokenCountParams{
		ID:           u.ID,
		InviteTokens: u.InviteTokens,
	})

	return int(u.InviteTokens), err
}

// GenerateInviteKeys creates and returns an invite key, using a token if
// required. If useToken is true and the user has no invite tokens, then
// an error is returned.
func generateInviteKeys(ctx context.Context, tx *queries.Queries, userID uuid.UUID, input *models.GenerateInviteCodeInput, useToken bool) ([]uuid.UUID, error) {
	keys := 1
	if input.Keys != nil {
		keys = *input.Keys
	}

	// don't allow more than 50 keys to be generated at a time
	if keys > 50 {
		keys = 50
	}

	var ret []uuid.UUID

	for i := 0; i < keys; i++ {
		if useToken {
			u, err := tx.FindUser(ctx, userID)
			if err != nil {
				return nil, err
			}

			if u.InviteTokens <= 0 {
				return nil, ErrNoInviteTokens
			}

			_, err = repealInviteTokens(ctx, tx, userID, 1)
			if err != nil {
				return nil, err
			}
		}

		// create the invite key
		UUID, err := uuid.NewV4()
		if err != nil {
			return nil, err
		}

		newKey := queries.CreateInviteKeyParams{
			ID:          UUID,
			GeneratedBy: userID,
		}

		if input != nil {
			if input.Uses != nil && *input.Uses > 0 {
				uses := *input.Uses
				newKey.Uses = &uses
			}
			if input.TTL != nil {
				expires := time.Now().Add(time.Duration(*input.TTL) * time.Second)
				newKey.ExpireTime = &expires
			}
		}

		key, err := tx.CreateInviteKey(ctx, newKey)
		if err != nil {
			return nil, err
		}

		ret = append(ret, key.ID)
	}

	return ret, nil
}

// RescindInviteKey makes an invite key invalid, refunding the invite token if
// required. Returns an error if the invite key is already in use.
func rescindInviteKey(ctx context.Context, tx *queries.Queries, key uuid.UUID, userID uuid.UUID, refundToken bool) error {
	// ensure userID matches that of the invite key
	k, err := tx.FindInviteKey(ctx, key)
	if err != nil {
		return err
	}

	if k.GeneratedBy != userID {
		return fmt.Errorf("invalid key")
	}

	// ensure key is not already activated
	tokens, err := tx.FindUserTokensByInviteKey(ctx, key)
	if err != nil {
		return err
	}
	if len(tokens) > 0 {
		return ErrInviteKeyAlreadyUsed
	}

	// destroy the key
	err = tx.DeleteInviteKey(ctx, key)
	if err != nil {
		return err
	}

	// refund the invite token if required
	if refundToken {
		_, err := tx.FindUser(ctx, userID)
		if err != nil {
			return err
		}

		_, err = grantInviteTokens(ctx, tx, userID, 1)
		if err != nil {
			return err
		}
	}

	return nil
}
