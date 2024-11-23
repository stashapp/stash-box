package models

import (
	"github.com/gofrs/uuid"
)

type UserTokenRepo interface {
	UserTokenFinder
	UserTokenCreator

	Destroy(id uuid.UUID) error
	DestroyExpired() error
	Count() (int, error)
}

type UserTokenFinder interface {
	Find(id uuid.UUID) (*UserToken, error)
	FindByInviteKey(key uuid.UUID) ([]*UserToken, error)
}

type UserTokenCreator interface {
	Create(newActivation UserToken) (*UserToken, error)
}
