package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *queryResolver) FindImage(ctx context.Context, id uuid.UUID) (*models.Image, error) {
	return r.services.Image().Find(ctx, id)
}
