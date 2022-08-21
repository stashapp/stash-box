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
	UpdateRoles(userID uuid.UUID, updatedJoins UserRoles) error

	Count() (int, error)
	Query(filter UserQueryInput) (Users, int, error)
	GetRoles(id uuid.UUID) (UserRoles, error)
	CountVotesByType(id uuid.UUID) (*UserVoteCount, error)
	CountEditsByStatus(id uuid.UUID) (*UserEditCount, error)
	GetFingerprints(id uuid.UUID) ([]*Fingerprint, int, error)
}

// UserFinder is an interface to find and update User objects.
type UserFinder interface {
	Find(id uuid.UUID) (*User, error)
	FindByName(name string) (*User, error)
	FindByEmail(email string) (*User, error)
}
