package user

import (
	"errors"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

type testUserFinderUpdater struct {
	user      *models.User
	findErr   error
	updateErr error
}

func (u *testUserFinderUpdater) Find(id uuid.UUID) (*models.User, error) {
	if u.findErr != nil {
		return nil, u.findErr
	}

	return u.user, nil
}

func (u *testUserFinderUpdater) FindByEmail(email string) (*models.User, error) {
	if u.findErr != nil {
		return nil, u.findErr
	}

	return u.user, nil
}

func (u *testUserFinderUpdater) UpdateFull(updatedUser models.User) (*models.User, error) {
	if u.updateErr != nil {
		return nil, u.updateErr
	}

	return &updatedUser, nil
}

type grantInviteTokensTest struct {
	currentTokens  int
	toAdd          int
	findErr        error
	updateErr      error
	expectedTokens int
	expectedErr    error
}

var errUpdate = errors.New("update error")
var errFind = errors.New("find error")

var grantInviteScenarios = []grantInviteTokensTest{
	{0, 1, nil, nil, 1, nil},
	{0, 10, nil, nil, 10, nil},
	{0, 11, nil, nil, 10, nil},
	{10, -10, nil, nil, 10, nil},
	{0, 1, errFind, nil, 0, errFind},
	{0, 1, nil, errUpdate, 0, errUpdate},
}

func TestGrantInviteTokens(t *testing.T) {
	userID, err := uuid.NewV4()
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	for _, v := range grantInviteScenarios {
		uf := &testUserFinderUpdater{
			user: &models.User{
				InviteTokens: v.currentTokens,
			},
			findErr:   v.findErr,
			updateErr: v.updateErr,
		}

		tokens, err := GrantInviteTokens(uf, userID, v.toAdd)

		if !errors.Is(err, v.expectedErr) {
			t.Errorf("scenario: %v+ - (error) got %v; want %v", v, err, v.expectedErr)
			continue
		}

		if tokens != v.expectedTokens {
			t.Errorf("scenario: %v+ - (tokens) got %d; want %d", v, tokens, v.expectedTokens)
		}
	}
}

func TestGrantInviteTokensNotFound(t *testing.T) {
	userID, err := uuid.NewV4()
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	uf := &testUserFinderUpdater{}

	_, err = GrantInviteTokens(uf, userID, 1)

	if err == nil {
		t.Errorf("expected user not found error")
	}
}

var repealInviteScenarios = []grantInviteTokensTest{
	{1, 1, nil, nil, 0, nil},
	{11, 10, nil, nil, 1, nil},
	{100, 11, nil, nil, 89, nil},
	{10, -11, nil, nil, 10, nil},
	{10, 11, nil, nil, 0, nil},
	{0, 1, errFind, nil, 0, errFind},
	{0, 1, nil, errUpdate, 0, errUpdate},
}

func TestRepealInviteTokens(t *testing.T) {
	userID, err := uuid.NewV4()
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	for _, v := range repealInviteScenarios {
		uf := &testUserFinderUpdater{
			user: &models.User{
				InviteTokens: v.currentTokens,
			},
			findErr:   v.findErr,
			updateErr: v.updateErr,
		}

		tokens, err := RepealInviteTokens(uf, userID, v.toAdd)

		if !errors.Is(err, v.expectedErr) {
			t.Errorf("scenario: %v+ - (error) got %v; want %v", v, err, v.expectedErr)
			continue
		}

		if tokens != v.expectedTokens {
			t.Errorf("scenario: %v+ - (tokens) got %d; want %d", v, tokens, v.expectedTokens)
		}
	}
}

func TestRepealInviteTokensNotFound(t *testing.T) {
	userID, err := uuid.NewV4()
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	uf := &testUserFinderUpdater{}

	_, err = RepealInviteTokens(uf, userID, 1)

	if err == nil {
		t.Errorf("expected user not found error")
	}
}
