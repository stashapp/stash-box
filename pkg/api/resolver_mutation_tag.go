package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) TagCreate(ctx context.Context, input models.TagCreateInput) (*models.Tag, error) {
	return r.services.Tag().Create(ctx, input)
}

func (r *mutationResolver) TagUpdate(ctx context.Context, input models.TagUpdateInput) (*models.Tag, error) {
	return r.services.Tag().Update(ctx, input)
}

func (r *mutationResolver) TagDestroy(ctx context.Context, input models.TagDestroyInput) (bool, error) {
	err := r.services.Tag().Delete(ctx, input)
	return err == nil, err
}
