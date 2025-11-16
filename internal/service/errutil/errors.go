package errutil

import (
	"errors"

	"github.com/jackc/pgx/v5"
)

// IgnoreNotFound returns nil if err is pgx.ErrNoRows, otherwise returns err.
// This is useful for queries where "not found" should be treated as a non-error case.
func IgnoreNotFound(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	return err
}

// DuplicateError creates a slice of the same error repeated size times.
// This is useful for dataloader methods that need to return one error per requested ID.
func DuplicateError(err error, size int) []error {
	errs := make([]error, size)
	for i := range errs {
		errs[i] = err
	}
	return errs
}
