package user

import (
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stashdb/pkg/models"
)

// UserFinderUpdater is an interface to find and update User objects.
type UserFinderUpdater interface {
	Find(id uuid.UUID) (*models.User, error)
	Update(updatedUser models.User) (*models.User, error)
}

// GrantInviteTokens increments the invite token count for a user by up to 10.
func GrantInviteTokens(uf UserFinderUpdater, userID uuid.UUID, tokens int) (int, error) {
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
	_, err = uf.Update(*u)
	if err != nil {
		return 0, err
	}

	return u.InviteTokens, nil
}

// RepealInviteTokens decrements a user's invite token count by the provided
// amount. Invite tokens are constrained to a minimum of 0.
func RepealInviteTokens(uf UserFinderUpdater, userID uuid.UUID, tokens int) (int, error) {
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

	_, err = uf.Update(*u)
	if err != nil {
		return 0, err
	}

	return u.InviteTokens, nil
}
