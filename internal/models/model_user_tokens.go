package models

import (
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	UserTokenTypeNewUser         = "NEW_USER"
	UserTokenTypeResetPassword   = "RESET_PASSWORD"
	UserTokenTypeConfirmOldEmail = "CONFIRM_OLD_EMAIL"
	UserTokenTypeConfirmNewEmail = "CONFIRM_NEW_EMAIL"
)

type UserToken struct {
	ID        uuid.UUID       `json:"id"`
	Data      json.RawMessage `json:"data"`
	Type      string          `json:"type"`
	CreatedAt time.Time       `json:"created_at"`
	ExpiresAt time.Time       `json:"expires_at"`
}

func (t *UserToken) SetData(data interface{}) error {
	jsonData, err := utils.ToJSON(data)
	if err != nil {
		return err
	}
	t.Data = jsonData
	return nil
}

type NewUserTokenData struct {
	Email     string     `json:"email"`
	InviteKey *uuid.UUID `json:"invite_key,omitempty"`
}

func (t *UserToken) GetNewUserTokenData() (*NewUserTokenData, error) {
	var obj NewUserTokenData
	err := utils.FromJSON(t.Data, &obj)
	return &obj, err
}

type UserTokenData struct {
	UserID uuid.UUID `json:"user_id"`
}

func (t *UserToken) GetUserTokenData() (*UserTokenData, error) {
	var obj UserTokenData
	err := utils.FromJSON(t.Data, &obj)
	return &obj, err
}

type ChangeEmailTokenData struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
}

func (t *UserToken) GetChangeEmailTokenData() (*ChangeEmailTokenData, error) {
	var obj ChangeEmailTokenData
	err := utils.FromJSON(t.Data, &obj)
	return &obj, err
}
