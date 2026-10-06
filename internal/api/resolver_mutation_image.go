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

func (r *mutationResolver) ImageSetOrganized(ctx context.Context, input models.ImageSetOrganizedInput) (*models.Image, error) {
	return r.services.Image().SetOrganized(ctx, input)
}

func (r *mutationResolver) ImageRevertCategorization(ctx context.Context, input models.ImageRevertCategorizationInput) (*models.Image, error) {
	return r.services.Image().RevertCategorization(ctx, input)
}

func (r *mutationResolver) ImageRecrop(ctx context.Context, input models.ImageRecropInput) (*models.Image, error) {
	return r.services.Image().Recrop(ctx, input)
}

func (r *mutationResolver) ImageDestroy(ctx context.Context, input models.ImageDestroyInput) (bool, error) {
	err := r.services.Image().Destroy(ctx, input.ID)

	if err != nil {
		return false, err
	}

	return true, nil
}
