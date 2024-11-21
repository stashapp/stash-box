package user

import (
	"bytes"
	"embed"
	"fmt"
	"text/template"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/email"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

//go:embed templates/*.html
//go:embed templates/*.txt
var templateFS embed.FS

var emailChangeTokenLifetime = time.Minute * 15

func ConfirmOldEmail(fac models.Repo, em *email.Manager, user models.User) error {
	tqb := fac.UserToken()

	// generate an activation key and email
	key, err := generateConfirmOldEmailKey(tqb, user.ID)
	if err != nil {
		return err
	}

	return sendConfirmOldEmail(em, user, *key)
}

func generateConfirmOldEmailKey(aqb models.UserTokenCreator, userID uuid.UUID) (*uuid.UUID, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	activation := models.UserToken{
		ID:        UUID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(emailChangeTokenLifetime),
		Type:      models.UserTokenTypeConfirmOldEmail,
	}

	if err := activation.SetData(models.UserTokenData{
		UserID: userID,
	}); err != nil {
		return nil, err
	}

	obj, err := aqb.Create(activation)
	if err != nil {
		return nil, err
	}

	return &obj.ID, nil
}

func ConfirmNewEmail(fac models.Repo, em *email.Manager, user models.User, email string) error {
	tqb := fac.UserToken()

	// generate an activation key and email
	key, err := generateConfirmNewEmailKey(tqb, user.ID, email)
	if err != nil {
		return err
	}

	return sendConfirmNewEmail(em, &user, email, *key)
}

func generateConfirmNewEmailKey(aqb models.UserTokenCreator, userID uuid.UUID, email string) (*uuid.UUID, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	activation := models.UserToken{
		ID:        UUID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(emailChangeTokenLifetime),
		Type:      models.UserTokenTypeConfirmNewEmail,
	}

	err = activation.SetData(models.ChangeEmailTokenData{
		UserID: userID,
		Email:  email,
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

func sendTemplatedEmail(em *email.Manager, email, subject, preHeader, greeting, content, link, cta string) error {
	htmlTemplates, err := template.ParseFS(templateFS,
		"templates/email.html",
	)
	if err != nil {
		return err
	}

	data := struct {
		SiteName   string
		SiteURL    string
		Content    string
		ActionURL  string
		ActionText string
		Greeting   string
		PreHeader  string
	}{
		SiteURL:    config.GetHostURL(),
		SiteName:   config.GetTitle(),
		Content:    content,
		ActionURL:  link,
		ActionText: cta,
		Greeting:   greeting,
		PreHeader:  preHeader,
	}

	var html bytes.Buffer
	if err := htmlTemplates.Execute(&html, data); err != nil {
		return err
	}

	textTemplate, err := template.ParseFS(templateFS,
		"templates/email.txt",
	)
	if err != nil {
		return err
	}

	var text bytes.Buffer
	if err := textTemplate.Execute(&text, data); err != nil {
		return err
	}

	return em.Send(email, subject, text.String(), html.String())
}

func sendConfirmOldEmail(em *email.Manager, user models.User, activationKey uuid.UUID) error {
	subject := "Email change requested"
	link := fmt.Sprintf("%s/users/%s/change-email?key=%s", config.GetHostURL(), user.Name, activationKey)
	preHeader := "Confirm you want to change your email."
	greeting := fmt.Sprintf("Hi %s,", user.Name)
	content := "An email change was requested for your account. Click the button below to confirm you want to continue. <strong>The link is only valid for 15 minutes.</strong>"
	cta := "Confirm email change"

	return sendTemplatedEmail(em, user.Email, subject, preHeader, greeting, content, link, cta)
}

func sendNewUserEmail(em *email.Manager, email string, activationKey uuid.UUID) error {
	subject := "Activate your account"
	link := fmt.Sprintf("%s/activate?key=%s", config.GetHostURL(), activationKey)
	preHeader := fmt.Sprintf("Welcome, to activate your %s account, click the button below.", config.GetTitle())
	greeting := "Welcome!"
	content := fmt.Sprintf("To activate your %s account, click the button below. <strong>The activation link is valid for %s.</strong>", config.GetTitle(), config.GetActivationExpiry())
	cta := "Activate account"

	return sendTemplatedEmail(em, email, subject, preHeader, greeting, content, link, cta)
}

func sendResetPasswordEmail(em *email.Manager, user *models.User, activationKey uuid.UUID) error {
	subject := fmt.Sprintf("Confirm %s password reset", config.GetTitle())
	link := fmt.Sprintf("%s/reset-password?key=%s", config.GetHostURL(), activationKey)
	preHeader := fmt.Sprintf("A password reset was requested for your %s account. Click the button to continue.", config.GetTitle())
	greeting := fmt.Sprintf("Hi %s,", user.Name)
	content := fmt.Sprintf("A password reset was requested for your %s account. Click the button below to continue. <strong>The link is only valid for 15 minutes.</strong>", config.GetTitle())
	cta := "Reset password"

	return sendTemplatedEmail(em, user.Email, subject, preHeader, greeting, content, link, cta)
}

func sendConfirmNewEmail(em *email.Manager, user *models.User, email string, activationKey uuid.UUID) error {
	subject := fmt.Sprintf("Confirm %s email change", config.GetTitle())
	link := fmt.Sprintf("%s/users/%s/confirm-email?key=%s", config.GetHostURL(), user.Name, activationKey)
	preHeader := fmt.Sprintf("To confirm you want to change your %s account email, click the button to continue.", config.GetTitle())
	greeting := fmt.Sprintf("Hi %s,", user.Name)
	content := fmt.Sprintf("To confirm you want to change your %s account email, click the button to continue. <strong>The link is only valid for 15 minutes.</strong>", config.GetTitle())
	cta := "Confirm email change"

	return sendTemplatedEmail(em, email, subject, preHeader, greeting, content, link, cta)
}
