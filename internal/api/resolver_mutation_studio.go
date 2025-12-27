package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) StudioCreate(ctx context.Context, input models.StudioCreateInput) (*models.Studio, error) {
	return r.services.Studio().Create(ctx, input)
}

func (r *mutationResolver) StudioUpdate(ctx context.Context, input models.StudioUpdateInput) (*models.Studio, error) {
	return r.services.Studio().Update(ctx, input, r.services.Image())
}

func (r *mutationResolver) StudioDestroy(ctx context.Context, input models.StudioDestroyInput) (bool, error) {
	err := r.services.Studio().Delete(ctx, input.ID)
	return err == nil, err
}

func (r *mutationResolver) FavoriteStudio(ctx context.Context, id uuid.UUID, favorite bool) (bool, error) {
	err := r.services.Studio().Favorite(ctx, id, favorite)
	return err == nil, err
}
