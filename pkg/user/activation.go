package user

import (
	"errors"
	"math/rand"
	"net/url"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/email"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

var ErrInvalidActivationKey = errors.New("invalid activation key")

// NewUser registers a new user. It returns the activation key only if
// email verification is not required, otherwise it returns nil.
func NewUser(fac models.Repo, em *email.Manager, email, inviteKey string) (*string, error) {
	if err := ClearExpiredActivations(fac); err != nil {
		return nil, err
	}
	if err := ClearExpiredInviteKeys(fac); err != nil {
		return nil, err
	}

	// ensure user or pending activation with email does not already exist
	uqb := fac.User()
	aqb := fac.PendingActivation()
	iqb := fac.Invite()

	if err := validateUserEmail(email); err != nil {
		return nil, err
	}

	if err := validateExistingEmail(uqb, email); err != nil {
		return nil, err
	}

	// if existing activation exists with the same email, then re-create it
	a, err := aqb.FindByEmail(email, models.PendingActivationTypeNewUser)
	if err != nil {
		return nil, err
	}

	if a != nil {
		if err := aqb.Destroy(a.ID); err != nil {
			return nil, err
		}
	}

	inviteID, err := validateInviteKey(iqb, aqb, inviteKey)
	if err != nil {
		return nil, err
	}

	// generate an activation key and email
	key, err := generateActivationKey(aqb, email, inviteID)
	if err != nil {
		return nil, err
	}

	// if activation is not required, then return the activation key
	if !config.GetRequireActivation() {
		return &key, nil
	}

	if err := sendNewUserEmail(em, email, key); err != nil {
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

func validateInviteKey(iqb models.InviteKeyFinder, aqb models.PendingActivationFinder, inviteKey string) (uuid.NullUUID, error) {
	var ret uuid.NullUUID
	if config.GetRequireInvite() {
		if inviteKey == "" {
			return ret, errors.New("invite key required")
		}

		var err error
		ret.UUID, _ = uuid.FromString(inviteKey)
		ret.Valid = true

		key, err := iqb.Find(ret.UUID)
		if err != nil {
			return ret, err
		}

		if key == nil {
			return ret, errors.New("invalid invite key")
		}

		// ensure invite key is not expired
		if key.Expires != nil && key.Expires.Before(time.Now()) {
			return ret, errors.New("invite key expired")
		}

		// ensure key isn't already used
		a, err := aqb.FindByInviteKey(inviteKey, models.PendingActivationTypeNewUser)
		if err != nil {
			return ret, err
		}

		if key.Uses != nil && len(a) >= *key.Uses {
			return ret, errors.New("key already used")
		}
	}

	return ret, nil
}

func generateActivationKey(aqb models.PendingActivationCreator, email string, inviteKey uuid.NullUUID) (string, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return "", err
	}

	activation := models.PendingActivation{
		ID:        UUID,
		Email:     email,
		InviteKey: inviteKey,
		Time:      time.Now(),
		Type:      models.PendingActivationTypeNewUser,
	}

	obj, err := aqb.Create(activation)
	if err != nil {
		return "", err
	}

	return obj.ID.String(), nil
}

func ClearExpiredActivations(fac models.Repo) error {
	expireTime := config.GetActivationExpireTime()

	aqb := fac.PendingActivation()
	return aqb.DestroyExpired(expireTime)
}

func ClearExpiredInviteKeys(fac models.Repo) error {
	iqb := fac.Invite()
	return iqb.DestroyExpired()
}

func sendNewUserEmail(em *email.Manager, email, activationKey string) error {
	subject := "Subject: Activate stash-box account"

	link := config.GetHostURL() + "/activate?email=" + url.QueryEscape(email) + "&key=" + activationKey
	body := "Please click the following link to activate your account: " + link

	return em.Send(email, subject, body)
}

func ActivateNewUser(fac models.Repo, name, email, activationKey, password string) (*models.User, error) {
	if err := ClearExpiredActivations(fac); err != nil {
		return nil, err
	}

	id, _ := uuid.FromString(activationKey)

	uqb := fac.User()
	aqb := fac.PendingActivation()
	iqb := fac.Invite()

	a, err := aqb.Find(id)
	if err != nil {
		return nil, err
	}

	if a == nil || a.Email != email || a.Type != models.PendingActivationTypeNewUser {
		return nil, ErrInvalidActivationKey
	}

	// check expiry

	i, err := iqb.Find(a.InviteKey.UUID)
	if err != nil {
		return nil, err
	}

	if i == nil {
		return nil, errors.New("cannot find invite key")
	}

	invitedBy := i.GeneratedBy

	createInput := models.UserCreateInput{
		Name:        name,
		Email:       email,
		Password:    password,
		InvitedByID: &invitedBy,
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
	if err := aqb.Destroy(id); err != nil {
		return nil, err
	}

	// decrement the invite key uses
	usesLeft, err := iqb.KeyUsed(i.ID)
	if err != nil {
		return nil, err
	}

	// if all used up, then delete the invite key
	if usesLeft != nil && *usesLeft <= 0 {
		// delete the invite key
		if err := iqb.Destroy(a.InviteKey.UUID); err != nil {
			return nil, err
		}
	}

	return ret, nil
}

// ResetPassword generates an email to reset a users password.
func ResetPassword(fac models.Repo, em *email.Manager, email string) error {
	uqb := fac.User()
	aqb := fac.PendingActivation()

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

	// if existing activation exists with the same email, then re-create it
	a, err := aqb.FindByEmail(email, models.PendingActivationTypeResetPassword)
	if err != nil {
		return err
	}

	if a != nil {
		if err := aqb.Destroy(a.ID); err != nil {
			return err
		}
	}

	// generate an activation key and email
	key, err := generateResetPasswordActivationKey(aqb, email)
	if err != nil {
		return err
	}

	return sendResetPasswordEmail(em, email, key)
}

func generateResetPasswordActivationKey(aqb models.PendingActivationCreator, email string) (string, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return "", err
	}

	activation := models.PendingActivation{
		ID:    UUID,
		Email: email,
		Time:  time.Now(),
		Type:  models.PendingActivationTypeResetPassword,
	}

	obj, err := aqb.Create(activation)
	if err != nil {
		return "", err
	}

	return obj.ID.String(), nil
}

func sendResetPasswordEmail(em *email.Manager, email, activationKey string) error {
	subject := "Subject: Reset stash-box password"

	link := config.GetHostURL() + "/resetPassword?email=" + email + "&key=" + activationKey
	body := "Please click the following link to set your account password: " + link

	return em.Send(email, subject, body)
}

func ActivateResetPassword(fac models.Repo, activationKey string, newPassword string) error {
	if err := ClearExpiredActivations(fac); err != nil {
		return err
	}

	id, _ := uuid.FromString(activationKey)

	uqb := fac.User()
	aqb := fac.PendingActivation()

	a, err := aqb.Find(id)
	if err != nil {
		return err
	}

	if a == nil || a.Type != models.PendingActivationTypeResetPassword {
		return ErrInvalidActivationKey
	}

	user, err := uqb.FindByEmail(a.Email)
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
	return aqb.Destroy(id)
}
