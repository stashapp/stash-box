package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) ImageTypeOrderUpdate(ctx context.Context, input models.ImageTypeOrderInput) ([]models.ImageTypeGroup, error) {
	return r.services.ImageType().UpdateOrder(ctx, input)
}

func (r *mutationResolver) ImageTypeSetEnabled(ctx context.Context, input models.ImageTypeEnabledInput) ([]models.ImageTypeGroup, error) {
	return r.services.ImageType().SetEnabled(ctx, input)
}
