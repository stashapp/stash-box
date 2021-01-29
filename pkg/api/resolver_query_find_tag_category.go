package api

import (
	"context"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindTagCategory(ctx context.Context, id string) (*models.TagCategory, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewTagCategoryQueryBuilder(nil)

	UUID, _ := uuid.FromString(id)
	return qb.Find(UUID)
}

func (r *queryResolver) QueryTagCategories(ctx context.Context, filter *models.QuerySpec) (*models.QueryTagCategoriesResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewTagCategoryQueryBuilder(nil)

	categories, count, err := qb.Query(filter)
	if err != nil {
		return nil, err
	}

	return &models.QueryTagCategoriesResultType{
		TagCategories: categories,
		Count:         count,
	}, nil
}
