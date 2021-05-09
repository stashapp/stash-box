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

	if tagFilter.Name != nil {
		tagID, err := uuid.FromString(*tagFilter.Name)
		if err == nil {
			var tags []*models.Tag
			tag, _ := qb.Find(tagID)
			if tag != nil {
				tags = append(tags, tag)
			}
			return &models.QueryTagsResultType{
				Tags:  tags,
				Count: 1,
			}, nil
		}
	}

	tags, count, err := qb.Query(tagFilter, filter)
	if err != nil {
		return nil, err
	}

	return &models.QueryTagsResultType{
		Tags:  tags,
		Count: count,
	}, nil
}
