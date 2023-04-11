package user

import (
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

var ErrNoInviteTokens = errors.New("no invite tokens available")

type Finder interface {
	Find(id uuid.UUID) (*models.User, error)
}

type FinderUpdater interface {
	Finder
	UpdateFull(updatedUser models.User) (*models.User, error)
}

// GrantInviteTokens increments the invite token count for a user by up to 10.
func GrantInviteTokens(uf FinderUpdater, userID uuid.UUID, tokens int) (int, error) {
	u, err := uf.Find(userID)

	if err != nil {
		return 0, err
	}

	if u == nil {
		return 0, fmt.Errorf("user not found for id %s", userID.String())
	}

	// don't accept negative numbers
	if tokens < 0 {
		return u.InviteTokens, nil
	}

	// put a sensible limit on the number of tokens that can be granted at a time
	const maxTokens = 10
	if tokens > maxTokens {
		tokens = maxTokens
	}

	u.InviteTokens += tokens
	_, err = uf.UpdateFull(*u)
	if err != nil {
		return 0, err
	}

	return u.InviteTokens, nil
}

// RepealInviteTokens decrements a user's invite token count by the provided
// amount. Invite tokens are constrained to a minimum of 0.
func RepealInviteTokens(uf FinderUpdater, userID uuid.UUID, tokens int) (int, error) {
	u, err := uf.Find(userID)

	if err != nil {
		return 0, err
	}

	if u == nil {
		return 0, fmt.Errorf("user not found for id %s", userID.String())
	}

	// don't accept negative numbers
	if tokens < 0 {
		return u.InviteTokens, nil
	}

	// no limit on the tokens to repeal
	u.InviteTokens -= tokens

	// don't allow to go negative
	if u.InviteTokens < 0 {
		u.InviteTokens = 0
	}

	_, err = uf.UpdateFull(*u)
	if err != nil {
		return 0, err
	}

	return u.InviteTokens, nil
}

// GenerateInviteKey creates and returns an invite key, using a token if
// required. If useToken is true and the user has no invite tokens, then
// an error is returned.
func GenerateInviteKey(uf FinderUpdater, ic models.InviteKeyCreator, userID uuid.UUID, input *models.GenerateInviteCodeInput, useToken bool) (*uuid.UUID, error) {
	if useToken {
		u, err := uf.Find(userID)
		if err != nil {
			return nil, err
		}

		if u == nil {
			return nil, fmt.Errorf("user not found for id %s", userID.String())
		}

		if u.InviteTokens <= 0 {
			return nil, ErrNoInviteTokens
		}

		_, err = RepealInviteTokens(uf, userID, 1)
		if err != nil {
			return nil, err
		}
	}

	// create the invite key
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	newKey := models.InviteKey{
		ID:          UUID,
		GeneratedAt: time.Now(),
		GeneratedBy: userID,
	}

	if input != nil {
		if input.Uses != nil {
			uses := *input.Uses
			newKey.Uses = &uses
		}
		if input.TTL != nil {
			expires := time.Now().Add(time.Duration(*input.TTL) * time.Second)
			newKey.Expires = &expires
		}
	}

	_, err = ic.Create(newKey)
	if err != nil {
		return nil, err
	}

	return &UUID, nil
}

// RescindInviteKey makes an invite key invalid, refunding the invite token if
// required. Returns an error if the invite key is already in use.
func RescindInviteKey(uf FinderUpdater, ikd models.InviteKeyDestroyer, key uuid.UUID, userID uuid.UUID, refundToken bool) error {
	// ensure userID matches that of the invite key
	k, err := ikd.Find(key)
	if err != nil {
		return err
	}

	if k == nil {
		return fmt.Errorf("invalid key")
	}

	if k.GeneratedBy != userID {
		return fmt.Errorf("invalid key")
	}

	// TODO - ensure key is not already activated

	// destroy the key
	err = ikd.Destroy(key)
	if err != nil {
		return err
	}

	// refund the invite token if required
	if refundToken {
		u, err := uf.Find(userID)
		if err != nil {
			return err
		}

		if u == nil {
			return fmt.Errorf("user not found for id %s", userID.String())
		}

		_, err = GrantInviteTokens(uf, userID, 1)
		if err != nil {
			return err
		}
	}

	return nil
}
