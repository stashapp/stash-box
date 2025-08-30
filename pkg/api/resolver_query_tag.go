package api

import (
	"context"
	"strings"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindTag(ctx context.Context, id *uuid.UUID, name *string) (*models.Tag, error) {
	s := r.services.Tag()
	if id != nil {
		return s.Find(ctx, *id)
	} else if name != nil {
		return s.FindByName(ctx, *name)
	}

	return nil, nil
}

func (r *queryResolver) FindTagOrAlias(ctx context.Context, name string) (*models.Tag, error) {
	return r.services.Tag().FindByNameOrAlias(ctx, name)
}

func (r *queryResolver) QueryTags(ctx context.Context, input models.TagQueryInput) (*models.QueryTagsResultType, error) {
	s := r.services.Tag()
	if input.Name != nil {
		tagID, err := uuid.FromString(*input.Name)
		if err == nil {
			tag, err := s.Find(ctx, tagID)

			if tag != nil {
				return &models.QueryTagsResultType{
					Tags:  []*models.Tag{tag},
					Count: 1,
				}, err
			}
		}
	}

	return s.Query(ctx, input)
}

func (r *queryResolver) SearchTag(ctx context.Context, term string, limit *int) ([]*models.Tag, error) {
	trimmedQuery := strings.TrimSpace(term)
	tagID, err := uuid.FromString(trimmedQuery)
	if err == nil {
		var tags []*models.Tag
		tag, err := r.services.Tag().Find(ctx, tagID)
		if tag != nil {
			tags = append(tags, tag)
		}
		return tags, err
	}

	searchLimit := 10
	if limit != nil {
		searchLimit = *limit
	}

	return r.services.Tag().SearchTags(ctx, trimmedQuery, searchLimit)
}
