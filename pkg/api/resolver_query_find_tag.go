package api

import (
	"context"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindTag(ctx context.Context, id *string, name *string) (*models.Tag, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewTagQueryBuilder(nil)

	if id != nil {
		idUUID, _ := uuid.FromString(*id)
		return qb.Find(idUUID)
	} else if name != nil {
		return qb.FindByName(*name)
	}

	return nil, nil
}

func (r *queryResolver) QueryTags(ctx context.Context, tagFilter *models.TagFilterType, filter *models.QuerySpec) (*models.QueryTagsResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewTagQueryBuilder(nil)

	tags, count, err := qb.Query(tagFilter, filter)
	if err != nil {
		return nil, err
	}

	return &models.QueryTagsResultType{
		Tags:  tags,
		Count: count,
	}, nil
}
