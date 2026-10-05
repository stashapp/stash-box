package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) SiteCategoryCreate(ctx context.Context, input models.SiteCategoryCreateInput) (*models.SiteCategory, error) {
	return r.services.Site().CreateCategory(ctx, input)
}

func (r *mutationResolver) SiteCategoryUpdate(ctx context.Context, input models.SiteCategoryUpdateInput) (*models.SiteCategory, error) {
	return r.services.Site().UpdateCategory(ctx, input)
}

func (r *mutationResolver) SiteCategoryDestroy(ctx context.Context, input models.SiteCategoryDestroyInput) (bool, error) {
	err := r.services.Site().DeleteCategory(ctx, input)

	return err == nil, err
}
