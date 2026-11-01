package studio

import (
	"context"
	"errors"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/queries"
)

var ErrInvalidParent = errors.New("invalid studio parent")

// ValidateParent enforces a single level of studios below a network.
func ValidateParent(ctx context.Context, q *queries.Queries, studioID uuid.UUID, parentID *uuid.UUID) error {
	if parentID == nil {
		return nil
	}
	if studioID == *parentID {
		return fmt.Errorf("%w: a studio cannot be its own parent", ErrInvalidParent)
	}

	parent, err := q.FindStudio(ctx, *parentID)
	if err != nil {
		return err
	}
	if parent.ParentStudioID.Valid {
		return fmt.Errorf("%w: parent must be a top-level network", ErrInvalidParent)
	}
	if studioID != uuid.Nil {
		children, err := q.GetChildStudios(ctx, uuid.NullUUID{UUID: studioID, Valid: true})
		if err != nil {
			return err
		}
		if len(children) > 0 {
			return fmt.Errorf("%w: a network with child studios cannot have a parent", ErrInvalidParent)
		}
	}
	return nil
}
