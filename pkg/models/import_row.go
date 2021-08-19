package models

import (
	"github.com/gofrs/uuid"
)

type ImportRowRepo interface {
	QueryForUser(userID uuid.UUID, findFilter *QuerySpec) (ImportRows, int)

	Create(newRow ImportRow) (*ImportRow, error)
	DestroyForUser(userID uuid.UUID) error
}
