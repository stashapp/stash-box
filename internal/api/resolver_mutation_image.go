package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) ImageCreate(ctx context.Context, input models.ImageCreateInput) (*models.Image, error) {
	return r.services.Image().Create(ctx, input)
}

func (r *mutationResolver) ImageUpdate(ctx context.Context, input models.ImageUpdateInput) (*models.Image, error) {
	return r.services.Image().Update(ctx, input)
}

func (r *mutationResolver) ImageDestroy(ctx context.Context, input models.ImageDestroyInput) (bool, error) {
	err := r.services.Image().Destroy(ctx, input.ID)

	if err != nil {
		return false, err
	}

	return true, nil
}
