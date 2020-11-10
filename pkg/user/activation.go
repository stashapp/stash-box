package user

import (
	"errors"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stashdb/pkg/email"
	"github.com/stashapp/stashdb/pkg/manager/config"
	"github.com/stashapp/stashdb/pkg/models"
)

func NewUser(tx *sqlx.Tx, em *email.Manager, email, inviteKey string) error {
	if err := ClearExpiredActivations(tx); err != nil {
		return err
	}

	// ensure user or pending activation with email does not already exist
	uqb := models.NewUserQueryBuilder(tx)
	aqb := models.NewPendingActivationQueryBuilder(tx)
	iqb := models.NewInviteCodeQueryBuilder(tx)

	if err := validateUserEmail(email); err != nil {
		return err
	}

	if err := validateExistingEmail(&uqb, &aqb, email); err != nil {
		return err
	}

	inviteID, err := validateInviteKey(&iqb, &aqb, inviteKey)
	if err != nil {
		return err
	}

	// TODO - if activation not required, go directly to create user

	// generate an activation key and email
	key, err := generateActivationKey(&aqb, email, inviteID)
	if err != nil {
		return err
	}

	if err := sendNewUserEmail(em, email, key); err != nil {
		return err
	}

	return nil
}

func validateExistingEmail(f models.UserFinder, aqb models.PendingActivationFinder, email string) error {
	u, err := f.FindByEmail(email)
	if err != nil {
		return err
	}

	if u != nil {
		return errors.New("email already in use")
	}

	a, err := aqb.FindByEmail(email)
	if err != nil {
		return err
	}

	if a != nil {
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
		ret.UUID, err = uuid.FromString(inviteKey)
		if err != nil {
			return ret, err
		}
		ret.Valid = true

		key, err := iqb.Find(ret.UUID)
		if err != nil {
			return ret, err
		}

		if key == nil {
			return ret, errors.New("invalid invite key")
		}

		// ensure key isn't already used
		a, err := aqb.FindByKey(inviteKey)
		if err != nil {
			return ret, err
		}

		if a != nil {
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

	currentTime := time.Now()

	activation := models.PendingActivation{
		ID:        UUID,
		Email:     email,
		InviteKey: inviteKey,
		Time: models.SQLiteTimestamp{
			Timestamp: currentTime,
		},
		Type: models.PendingActivationTypeNewUser,
	}

	obj, err := aqb.Create(activation)
	if err != nil {
		return "", err
	}

	return obj.ID.String(), nil
}

func ClearExpiredActivations(tx *sqlx.Tx) error {
	expireTime := config.GetActivationExpireTime()

	aqb := models.NewPendingActivationQueryBuilder(tx)
	return aqb.DestroyExpired(expireTime)
}

func sendNewUserEmail(em *email.Manager, email, activationKey string) error {
	subject := "Subject: Activate stash-box account"

	link := config.GetHostURL() + "/activate?email=" + email + "&key=" + activationKey
	body := "Please click the following link to activate your account: " + link

	return em.Send(email, subject, body)
}

func ActivateNewUser(tx *sqlx.Tx, name, email, activationKey, password string) (*models.User, error) {
	if err := ClearExpiredActivations(tx); err != nil {
		return nil, err
	}

	id, err := uuid.FromString(activationKey)
	if err != nil {
		return nil, err
	}

	uqb := models.NewUserQueryBuilder(tx)
	aqb := models.NewPendingActivationQueryBuilder(tx)
	iqb := models.NewInviteCodeQueryBuilder(tx)

	a, err := aqb.Find(id)
	if err != nil {
		return nil, err
	}

	if a == nil {
		return nil, errors.New("invalid activation key")
	}

	if a.Email != email {
		return nil, errors.New("mismatched email address")
	}

	// check expiry

	i, err := iqb.Find(a.InviteKey.UUID)
	if err != nil {
		return nil, err
	}

	if i == nil {
		return nil, errors.New("cannot find invite key")
	}

	invitedBy := i.GeneratedBy.String()

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

	ret, err := Create(tx, createInput)
	if err != nil {
		return nil, err
	}

	// delete the activation
	if err := aqb.Destroy(id); err != nil {
		return nil, err
	}

	// delete the invite key
	if err := iqb.Destroy(a.InviteKey.UUID); err != nil {
		return nil, err
	}

	return ret, nil
}
