package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindTag(ctx context.Context, id *uuid.UUID, name *string) (*models.Tag, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Tag()

	if id != nil {
		return qb.Find(*id)
	} else if name != nil {
		return qb.FindByName(*name)
	}

	return nil, nil
}

func (r *queryResolver) FindTagOrAlias(ctx context.Context, name string) (*models.Tag, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Tag()

	return qb.FindByNameOrAlias(name)
}

func (r *queryResolver) QueryTags(ctx context.Context, input models.TagQueryInput) (*models.QueryTagsResultType, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Tag()

	if input.Name != nil {
		tagID, err := uuid.FromString(*input.Name)
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

	tags, count, err := qb.Query(input)
	if err != nil {
		return nil, err
	}

	return &models.QueryTagsResultType{
		Tags:  tags,
		Count: count,
	}, nil
}
