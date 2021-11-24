package models

import (
	"fmt"

	"github.com/gofrs/uuid"
)

// NotFoundError indicates that an object with the given id was not found.
type NotFoundError uuid.UUID

func (e NotFoundError) Error() string {
	return fmt.Sprintf("object with id %s not found", uuid.UUID(e).String())
}
