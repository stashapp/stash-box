package user

import (
	"errors"
	"math/rand"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/email"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

var ErrInvalidActivationKey = errors.New("invalid activation key")

var tokenLifetime = time.Minute * 15

// NewUser registers a new user. It returns the activation key only if
// email verification is not required, otherwise it returns nil.
func NewUser(fac models.Repo, em *email.Manager, email string, inviteKey *uuid.UUID) (*uuid.UUID, error) {
	// ensure user or pending activation with email does not already exist
	uqb := fac.User()
	tqb := fac.UserToken()
	iqb := fac.Invite()

	if err := validateUserEmail(email); err != nil {
		return nil, err
	}

	if err := validateExistingEmail(uqb, email); err != nil {
		return nil, err
	}

	if err := validateInviteKey(iqb, tqb, inviteKey); err != nil {
		return nil, err
	}

	// generate an activation key and email
	key, err := generateActivationKey(tqb, email, inviteKey)
	if err != nil {
		return nil, err
	}

	// if activation is not required, then return the activation key
	if !config.GetRequireActivation() {
		return key, nil
	}

	if err := sendNewUserEmail(em, email, *key); err != nil {
		return nil, err
	}

	return nil, nil
}

func validateExistingEmail(f models.UserFinder, email string) error {
	u, err := f.FindByEmail(email)
	if err != nil {
		return err
	}

	if u != nil {
		return errors.New("email already in use")
	}

	return nil
}

func validateInviteKey(iqb models.InviteKeyFinder, tqb models.UserTokenFinder, inviteKey *uuid.UUID) error {
	if config.GetRequireInvite() {
		if inviteKey == nil {
			return errors.New("invite key required")
		}

		key, err := iqb.Find(*inviteKey)
		if err != nil {
			return err
		}

		if key == nil {
			return errors.New("invalid invite key")
		}

		// ensure invite key is not expired
		if key.Expires != nil && key.Expires.Before(time.Now()) {
			return errors.New("invite key expired")
		}

		// ensure key isn't already used
		t, err := tqb.FindByInviteKey(*inviteKey)
		if err != nil {
			return err
		}

		if key.Uses != nil && len(t) >= *key.Uses {
			return errors.New("key already used")
		}
	}

	return nil
}

func generateActivationKey(tqb models.UserTokenCreator, email string, inviteKey *uuid.UUID) (*uuid.UUID, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	activation := models.UserToken{
		ID:        UUID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(config.GetActivationExpiry()),
		Type:      models.UserTokenTypeNewUser,
	}

	err = activation.SetData(models.NewUserTokenData{
		Email:     email,
		InviteKey: inviteKey,
	})
	if err != nil {
		return nil, err
	}

	token, err := tqb.Create(activation)
	if err != nil {
		return nil, err
	}

	return &token.ID, nil
}

func ActivateNewUser(fac models.Repo, name string, id uuid.UUID, password string) (*models.User, error) {
	uqb := fac.User()
	tqb := fac.UserToken()
	iqb := fac.Invite()

	t, err := tqb.Find(id)
	if err != nil {
		return nil, err
	}
	if t == nil || t.Type != models.UserTokenTypeNewUser {
		return nil, ErrInvalidActivationKey
	}

	data, err := t.GetNewUserTokenData()
	if err != nil {
		return nil, err
	}

	var invitedBy *uuid.UUID
	if config.GetRequireInvite() {
		if data.InviteKey == nil {
			return nil, errors.New("cannot find invite key")
		}

		i, err := iqb.Find(*data.InviteKey)
		if err != nil {
			return nil, err
		}

		if i == nil {
			return nil, errors.New("cannot find invite key")
		}

		invitedBy = &i.GeneratedBy
	}

	createInput := models.UserCreateInput{
		Name:        name,
		Email:       data.Email,
		Password:    password,
		InvitedByID: invitedBy,
		Roles:       getDefaultUserRoles(),
	}

	if err := ValidateCreate(createInput); err != nil {
		return nil, err
	}

	// ensure user name does not already exist
	u, err := uqb.FindByName(name)
	if err != nil {
		return nil, err
	}

	if u != nil {
		return nil, errors.New("username already used")
	}

	ret, err := Create(fac, createInput)
	if err != nil {
		return nil, err
	}

	// delete the activation
	if err := tqb.Destroy(id); err != nil {
		return nil, err
	}

	if config.GetRequireInvite() {
		// decrement the invite key uses
		usesLeft, err := iqb.KeyUsed(*data.InviteKey)
		if err != nil {
			return nil, err
		}

		// if all used up, then delete the invite key
		if usesLeft != nil && *usesLeft <= 0 {
			// delete the invite key
			if err := iqb.Destroy(*data.InviteKey); err != nil {
				return nil, err
			}
		}
	}

	return ret, nil
}

// ResetPassword generates an email to reset a users password.
func ResetPassword(fac models.Repo, em *email.Manager, email string) error {
	uqb := fac.User()
	tqb := fac.UserToken()

	// ensure user exists
	u, err := uqb.FindByEmail(email)
	if err != nil {
		return err
	}

	// Sleep between 500-1500ms to avoid leaking email presence
	n := rand.Intn(1000)
	time.Sleep(time.Duration(500+n) * time.Millisecond)

	if u == nil {
		// return silently
		return nil
	}

	// generate an activation key and email
	key, err := generateResetPasswordActivationKey(tqb, u.ID)
	if err != nil {
		return err
	}

	return sendResetPasswordEmail(em, u, *key)
}

func generateResetPasswordActivationKey(aqb models.UserTokenCreator, userID uuid.UUID) (*uuid.UUID, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	activation := models.UserToken{
		ID:        UUID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(tokenLifetime),
		Type:      models.UserTokenTypeResetPassword,
	}

	err = activation.SetData(models.UserTokenData{
		UserID: userID,
	})
	if err != nil {
		return nil, err
	}

	obj, err := aqb.Create(activation)
	if err != nil {
		return nil, err
	}

	return &obj.ID, nil
}

func ActivateResetPassword(fac models.Repo, id uuid.UUID, newPassword string) error {
	uqb := fac.User()
	tqb := fac.UserToken()

	t, err := tqb.Find(id)
	if err != nil {
		return err
	}

	if t == nil || t.Type != models.UserTokenTypeResetPassword {
		return ErrInvalidActivationKey
	}

	data, err := t.GetUserTokenData()
	if err != nil {
		return err
	}

	user, err := uqb.Find(data.UserID)
	if err != nil {
		return err
	}

	if user == nil {
		return errors.New("user does not exist")
	}

	err = validateUserPassword(user.Name, user.Email, newPassword)
	if err != nil {
		return err
	}

	err = user.SetPasswordHash(newPassword)
	if err != nil {
		return err
	}
	user.UpdatedAt = time.Now()

	_, err = uqb.Update(*user)
	if err != nil {
		return err
	}

	// delete the activation
	return tqb.Destroy(id)
}
