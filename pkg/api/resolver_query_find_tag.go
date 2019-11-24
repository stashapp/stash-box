package api

import (
	"context"
	"strconv"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *queryResolver) FindTag(ctx context.Context, id *string, name *string) (*models.Tag, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewTagQueryBuilder(nil)

	if id != nil {
		idInt, _ := strconv.ParseInt(*id, 10, 64)
		return qb.Find(idInt)
	} else if name != nil {
		return qb.FindByNameOrAlias(*name)
	}

	return nil, nil
}

func (r *queryResolver) QueryTags(ctx context.Context, tagFilter *models.TagFilterType, filter *models.QuerySpec) (*models.QueryTagsResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewTagQueryBuilder(nil)

	tags, count := qb.Query(tagFilter, filter)
	return &models.QueryTagsResultType{
		Tags:  tags,
		Count: count,
	}, nil
}
