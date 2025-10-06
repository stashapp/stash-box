package email

import (
	"bytes"
	"context"
	"embed"
	"fmt"
	"text/template"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/internal/models"
)

//go:embed templates/*.html
//go:embed templates/*.txt
var templateFS embed.FS

func ConfirmOldEmail(ctx context.Context, tx *db.Queries, user models.User, mgr *Manager) error {
	// generate an activation key and email
	key, err := generateConfirmOldEmailKey(ctx, tx, user.ID)
	if err != nil {
		return err
	}

	return sendConfirmOldEmail(mgr, user, *key)
}

func generateConfirmOldEmailKey(ctx context.Context, tx *db.Queries, userID uuid.UUID) (*uuid.UUID, error) {
	data := models.UserTokenData{
		UserID: userID,
	}
	param, err := converter.CreateUserTokenParamsFromData(models.UserTokenTypeConfirmOldEmail, data)
	if err != nil {
		return nil, err
	}

	token, err := tx.CreateUserToken(ctx, param)
	if err != nil {
		return nil, err
	}

	return &token.ID, nil
}

func ConfirmNewEmail(ctx context.Context, tx *db.Queries, user models.User, email string, mgr *Manager) error {
	// generate an activation key and email
	key, err := generateConfirmNewEmailKey(ctx, tx, user.ID, email)
	if err != nil {
		return err
	}

	return sendConfirmNewEmail(mgr, &user, email, *key)
}

func generateConfirmNewEmailKey(ctx context.Context, tx *db.Queries, userID uuid.UUID, email string) (*uuid.UUID, error) {
	data := models.ChangeEmailTokenData{
		UserID: userID,
		Email:  email,
	}
	param, err := converter.CreateUserTokenParamsFromData(models.UserTokenTypeConfirmNewEmail, data)
	if err != nil {
		return nil, err
	}

	obj, err := tx.CreateUserToken(ctx, param)
	return &obj.ID, err
}

func ChangeEmail(ctx context.Context, tx *db.Queries, token models.ChangeEmailTokenData) error {
	user, err := tx.FindUser(ctx, token.UserID)
	if err != nil {
		return err
	}

	return tx.UpdateUserEmail(ctx, db.UpdateUserEmailParams{
		ID:    user.ID,
		Email: token.Email,
	})
}

func sendTemplatedEmail(mgr *Manager, email, subject, preHeader, greeting, content, link, cta string) error {
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

	return mgr.Send(email, subject, text.String(), html.String())
}

func sendConfirmOldEmail(mgr *Manager, user models.User, activationKey uuid.UUID) error {
	subject := "Email change requested"
	link := fmt.Sprintf("%s/users/%s/change-email?key=%s", config.GetHostURL(), user.Name, activationKey)
	preHeader := "Confirm you want to change your email."
	greeting := fmt.Sprintf("Hi %s,", user.Name)
	content := "An email change was requested for your account. Click the button below to confirm you want to continue. <strong>The link is only valid for 15 minutes.</strong>"
	cta := "Confirm email change"

	return sendTemplatedEmail(mgr, user.Email, subject, preHeader, greeting, content, link, cta)
}

func SendNewUserEmail(email string, activationKey uuid.UUID, mgr *Manager) error {
	subject := "Activate your account"
	link := fmt.Sprintf("%s/activate?key=%s", config.GetHostURL(), activationKey)
	preHeader := fmt.Sprintf("Welcome, to activate your %s account, click the button below.", config.GetTitle())
	greeting := "Welcome!"
	content := fmt.Sprintf("To activate your %s account, click the button below. <strong>The activation link is valid for %s.</strong>", config.GetTitle(), config.GetActivationExpiry())
	cta := "Activate account"

	return sendTemplatedEmail(mgr, email, subject, preHeader, greeting, content, link, cta)
}

func SendResetPasswordEmail(user db.User, activationKey uuid.UUID, mgr *Manager) error {
	subject := fmt.Sprintf("Confirm %s password reset", config.GetTitle())
	link := fmt.Sprintf("%s/reset-password?key=%s", config.GetHostURL(), activationKey)
	preHeader := fmt.Sprintf("A password reset was requested for your %s account. Click the button to continue.", config.GetTitle())
	greeting := fmt.Sprintf("Hi %s,", user.Name)
	content := fmt.Sprintf("A password reset was requested for your %s account. Click the button below to continue. <strong>The link is only valid for 15 minutes.</strong>", config.GetTitle())
	cta := "Reset password"

	return sendTemplatedEmail(mgr, user.Email, subject, preHeader, greeting, content, link, cta)
}

func sendConfirmNewEmail(mgr *Manager, user *models.User, email string, activationKey uuid.UUID) error {
	subject := fmt.Sprintf("Confirm %s email change", config.GetTitle())
	link := fmt.Sprintf("%s/users/%s/confirm-email?key=%s", config.GetHostURL(), user.Name, activationKey)
	preHeader := fmt.Sprintf("To confirm you want to change your %s account email, click the button to continue.", config.GetTitle())
	greeting := fmt.Sprintf("Hi %s,", user.Name)
	content := fmt.Sprintf("To confirm you want to change your %s account email, click the button to continue. <strong>The link is only valid for 15 minutes.</strong>", config.GetTitle())
	cta := "Confirm email change"

	return sendTemplatedEmail(mgr, email, subject, preHeader, greeting, content, link, cta)
}
