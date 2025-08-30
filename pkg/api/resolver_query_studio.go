package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindStudio(ctx context.Context, id *uuid.UUID, name *string) (*models.Studio, error) {
	if id != nil {
		return r.services.Studio().FindByID(ctx, *id)
	} else if name != nil {
		return r.services.Studio().FindByName(ctx, *name)
	}

	return nil, nil
}

func (r *queryResolver) QueryStudios(ctx context.Context, input models.StudioQueryInput) (*models.QueryStudiosResultType, error) {
	return r.services.Studio().Query(ctx, input)
}

func (r *queryResolver) SearchStudio(ctx context.Context, term string, limit *int) ([]*models.Studio, error) {
	s := r.services.Studio()

	id := parseUUID(term)
	if !id.IsNil() {
		var studios []*models.Studio
		studio, err := s.FindByID(ctx, id)
		if studio != nil {
			studios = append(studios, studio)
		}
		return studios, err
	}

	searchLimit := 10
	if limit != nil {
		searchLimit = *limit
	}

	return r.services.Studio().Search(ctx, term, searchLimit)
}
