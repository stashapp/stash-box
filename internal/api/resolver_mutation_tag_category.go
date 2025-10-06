package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) TagCategoryCreate(ctx context.Context, input models.TagCategoryCreateInput) (*models.TagCategory, error) {
	return r.services.Tag().CreateCategory(ctx, input)
}

func (r *mutationResolver) TagCategoryUpdate(ctx context.Context, input models.TagCategoryUpdateInput) (*models.TagCategory, error) {
	return r.services.Tag().UpdateCategory(ctx, input)
}

func (r *mutationResolver) TagCategoryDestroy(ctx context.Context, input models.TagCategoryDestroyInput) (bool, error) {
	err := r.services.Tag().DeleteCategory(ctx, input)

	return err == nil, err
}
