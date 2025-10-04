package api

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindDrafts(ctx context.Context) ([]models.Draft, error) {
	user := auth.GetCurrentUser(ctx)
	return r.services.Draft().FindByUser(ctx, user.ID)
}

func (r *queryResolver) FindDraft(ctx context.Context, id uuid.UUID) (*models.Draft, error) {
	draft, err := r.services.Draft().FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	user := auth.GetCurrentUser(ctx)
	if user.ID != draft.UserID {
		return nil, fmt.Errorf("draft not found: %s", id)
	}

	return draft, nil
}
