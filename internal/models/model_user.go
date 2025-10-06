package models

import (
	"time"

	"github.com/gofrs/uuid"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           uuid.UUID     `json:"id"`
	Name         string        `json:"name"`
	PasswordHash string        `json:"password_hash"`
	Email        string        `json:"email"`
	APIKey       string        `json:"api_key"`
	APICalls     int           `json:"api_calls"`
	InviteTokens int           `json:"invite_tokens"`
	InvitedByID  uuid.NullUUID `json:"invited_by"`
	LastAPICall  time.Time     `json:"last_api_call"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

func (p *User) SetPasswordHash(pw string) error {
	// generate password from input
	hash, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)

	if err != nil {
		return err
	}

	p.PasswordHash = string(hash)

	return nil
}

func (p User) IsPasswordCorrect(pw string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(p.PasswordHash), []byte(pw))
	return err == nil
}
