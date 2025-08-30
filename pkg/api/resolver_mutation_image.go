package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) ImageCreate(ctx context.Context, input models.ImageCreateInput) (*models.Image, error) {
	return r.services.Image().Create(ctx, input)
}

func (r *mutationResolver) ImageDestroy(ctx context.Context, input models.ImageDestroyInput) (bool, error) {
	err := r.services.Image().Destroy(ctx, input.ID)

	if err != nil {
		return false, err
	}

	return true, nil
}
