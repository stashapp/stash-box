package user

import (
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/email"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

func ConfirmOldEmail(fac models.Repo, em *email.Manager, user models.User) error {
	tqb := fac.UserToken()

	// generate an activation key and email
	key, err := generateConfirmOldEmailKey(tqb, user.ID)
	if err != nil {
		return err
	}

	return sendConfirmOldEmail(em, user.Email, *key)
}

func generateConfirmOldEmailKey(aqb models.UserTokenCreator, userID uuid.UUID) (*uuid.UUID, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	activation := models.UserToken{
		ID:        UUID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(tokenLifetime),
		Type:      models.UserTokenTypeConfirmOldEmail,
	}

	activation.SetData(models.UserTokenData{
		UserID: userID,
	})

	obj, err := aqb.Create(activation)
	if err != nil {
		return nil, err
	}

	return &obj.ID, nil
}

func sendConfirmOldEmail(em *email.Manager, email string, activationKey uuid.UUID) error {
	subject := "Subject: Email change requested"

	link := fmt.Sprintf("%s/change-email?key=%s", config.GetHostURL(), activationKey)
	body := "Please click the following link to set your account password: " + link

	return em.Send(email, subject, body)
}

func ConfirmNewEmail(fac models.Repo, em *email.Manager, user models.User, email string) error {
	tqb := fac.UserToken()

	// generate an activation key and email
	key, err := generateConfirmNewEmailKey(tqb, user.ID, email)
	if err != nil {
		return err
	}

	return sendConfirmOldEmail(em, email, *key)
}

func generateConfirmNewEmailKey(aqb models.UserTokenCreator, userID uuid.UUID, email string) (*uuid.UUID, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	activation := models.UserToken{
		ID:        UUID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(tokenLifetime),
		Type:      models.UserTokenTypeConfirmNewEmail,
	}

	activation.SetData(models.ChangeEmailTokenData{
		UserID: userID,
		Email:  email,
	})

	obj, err := aqb.Create(activation)
	if err != nil {
		return nil, err
	}

	return &obj.ID, nil
}

func sendConfirmNewEmail(em *email.Manager, email string, activationKey uuid.UUID) error {
	subject := "Subject: Email change requested"

	link := fmt.Sprintf("%s/change-email2?key=%s", config.GetHostURL(), activationKey)
	body := "Please click the following link to set your account password: " + link

	return em.Send(email, subject, body)
}

func ChangeEmail(fac models.Repo, token models.ChangeEmailTokenData) error {
	uqb := fac.User()

	user, err := uqb.Find(token.UserID)
	if err != nil {
		return err
	}

	user.Email = token.Email
	user.UpdatedAt = time.Now()

	_, err = uqb.Update(*user)
	return err
}
