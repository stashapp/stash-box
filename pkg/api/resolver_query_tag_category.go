package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindTagCategory(ctx context.Context, id uuid.UUID) (*models.TagCategory, error) {
	return r.services.Tag().FindCategory(ctx, id)
}

func (r *queryResolver) QueryTagCategories(ctx context.Context) (*models.QueryTagCategoriesResultType, error) {
	count, categories, err := r.services.Tag().QueryCategories(ctx)
	if err != nil {
		return nil, err
	}

	return &models.QueryTagCategoriesResultType{
		TagCategories: categories,
		Count:         count,
	}, nil
}
