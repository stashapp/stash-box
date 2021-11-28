package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindTagCategory(ctx context.Context, id string) (*models.TagCategory, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.TagCategory()

	UUID, _ := uuid.FromString(id)
	return qb.Find(UUID)
}

func (r *queryResolver) QueryTagCategories(ctx context.Context, filter *models.QuerySpec) (*models.QueryTagCategoriesResultType, error) {
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
