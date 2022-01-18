package models

import (
	"github.com/gofrs/uuid"
)

type DraftRepo interface {
	Create(newEdit Draft) (*Draft, error)
	Destroy(id uuid.UUID) error
	Find(id uuid.UUID) (*Draft, error)
	FindByUser(userID uuid.UUID) ([]*Draft, error)
	FindExpired(timeLimit int) ([]*Draft, error)
}
