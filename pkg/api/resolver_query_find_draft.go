package api

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindDrafts(ctx context.Context) ([]*models.Draft, error) {
	fac := r.getRepoFactory(ctx)

	user := getCurrentUser(ctx)
	return fac.Draft().FindByUser(user.ID)
}

func (r *queryResolver) FindDraft(ctx context.Context, id uuid.UUID) (*models.Draft, error) {
	fac := r.getRepoFactory(ctx)

	user := getCurrentUser(ctx)
	draft, err := fac.Draft().Find(id)
	if err != nil {
		return nil, err
	}

	if draft == nil || user.ID != draft.UserID {
		return nil, fmt.Errorf("draft not found: %s", id)
	}

	return draft, nil
}
