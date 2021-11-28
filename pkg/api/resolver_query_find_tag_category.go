package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindTagCategory(ctx context.Context, id uuid.UUID) (*models.TagCategory, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.TagCategory()

	return qb.Find(id)
}

func (r *queryResolver) QueryTagCategories(ctx context.Context, filter *models.QuerySpec) (*models.QueryTagCategoriesResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.TagCategory()

	categories, count, err := qb.Query(filter)
	if err != nil {
		return nil, err
	}

	return &models.QueryTagCategoriesResultType{
		TagCategories: categories,
		Count:         count,
	}, nil
}
