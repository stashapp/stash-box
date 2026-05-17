package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
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
	if draft == nil {
		return nil, nil
	}

	user := auth.GetCurrentUser(ctx)
	if user.ID != draft.UserID {
		return nil, nil
	}

	return draft, nil
}
