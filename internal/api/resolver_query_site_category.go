package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *queryResolver) FindSiteCategory(ctx context.Context, id uuid.UUID) (*models.SiteCategory, error) {
	return r.services.Site().FindCategory(ctx, id)
}

func (r *queryResolver) QuerySiteCategories(ctx context.Context) (*models.QuerySiteCategoriesResultType, error) {
	count, categories, err := r.services.Site().QueryCategories(ctx)
	if err != nil {
		return nil, err
	}

	return &models.QuerySiteCategoriesResultType{
		SiteCategories: categories,
		Count:          count,
	}, nil
}
