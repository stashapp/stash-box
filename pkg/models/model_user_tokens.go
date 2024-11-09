package models

import (
	"bytes"
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx/types"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	UserTokenTypeNewUser         = "NEW_USER"
	UserTokenTypeResetPassword   = "RESET_PASSWORD"
	UserTokenTypeConfirmOldEmail = "CONFIRM_OLD_EMAIL"
	UserTokenTypeConfirmNewEmail = "CONFIRM_NEW_EMAIL"
)

type UserToken struct {
	ID        uuid.UUID      `db:"id" json:"id"`
	Data      types.JSONText `db:"data" json:"data"`
	Type      string         `db:"type" json:"type"`
	CreatedAt time.Time      `db:"created_at" json:"created_at"`
	ExpiresAt time.Time      `db:"expires_at" json:"expires_at"`
}

func (t UserToken) GetID() uuid.UUID {
	return t.ID
}

type UserTokens []*UserToken

func (t UserTokens) Each(fn func(interface{})) {
	for _, v := range t {
		fn(*v)
	}
}

func (t *UserTokens) Add(o interface{}) {
	*t = append(*t, o.(*UserToken))
}

func (t *UserToken) SetData(data interface{}) error {
	buffer := &bytes.Buffer{}
	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(data); err != nil {
		return err
	}
	t.Data = buffer.Bytes()
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
