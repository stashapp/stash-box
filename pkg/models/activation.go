package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type PendingActivationRepo interface {
	PendingActivationFinder
	PendingActivationCreator

	Destroy(id uuid.UUID) error
	DestroyExpired(expireTime time.Time) error
	Count() (int, error)
}

type PendingActivationFinder interface {
	Find(id uuid.UUID) (*PendingActivation, error)
	FindByEmail(email string, activationType string) (*PendingActivation, error)
	FindByInviteKey(key string, activationType string) (*PendingActivation, error)
}

type PendingActivationCreator interface {
	Create(newActivation PendingActivation) (*PendingActivation, error)
}
