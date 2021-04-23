package models

import (
	"github.com/gofrs/uuid"
)

type UserRepo interface {
	UserFinder

	Create(newUser User) (*User, error)
	Update(updatedUser User) (*User, error)
	UpdateFull(updatedUser User) (*User, error)
	Destroy(id uuid.UUID) error
	CreateRoles(newJoins UserRoles) error
	UpdateRoles(studioID uuid.UUID, updatedJoins UserRoles) error

	Count() (int, error)
	Query(userFilter *UserFilterType, findFilter *QuerySpec) (Users, int)
	GetRoles(id uuid.UUID) (UserRoles, error)
	CountSuccessfulEdits(id uuid.UUID) (int, error)
	CountFailedEdits(id uuid.UUID) (int, error)
	CountVotesByType(id uuid.UUID, vote VoteTypeEnum) (int, error)
}

// UserFinder is an interface to find and update User objects.
type UserFinder interface {
	Find(id uuid.UUID) (*User, error)
	FindByName(name string) (*User, error)
	FindByEmail(email string) (*User, error)
}
