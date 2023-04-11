package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type InviteKeyRepo interface {
	InviteKeyFinder
	InviteKeyCreator
	InviteKeyDestroyer
	InviteKeyUser
}

type InviteKeyCreator interface {
	Create(newKey InviteKey) (*InviteKey, error)
}

type InviteKeyFinder interface {
	Find(id uuid.UUID) (*InviteKey, error)
	FindActiveKeysForUser(userID uuid.UUID, expireTime time.Time) (InviteKeys, error)
}

type InviteKeyDestroyer interface {
	InviteKeyFinder
	Destroy(id uuid.UUID) error
}

type InviteKeyUser interface {
	KeyUsed(id uuid.UUID) (*int, error)
}
