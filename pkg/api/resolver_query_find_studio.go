package api

import (
	"context"
	"github.com/satori/go.uuid"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *queryResolver) FindStudio(ctx context.Context, id *string, name *string) (*models.Studio, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewStudioQueryBuilder(nil)

	if id != nil {
		idUUID, _ := uuid.FromString(*id)
		return qb.Find(idUUID)
	} else if name != nil {
		return qb.FindByName(*name)
	}

	return nil, nil
}

func (r *queryResolver) QueryStudios(ctx context.Context, studioFilter *models.StudioFilterType, filter *models.QuerySpec) (*models.QueryStudiosResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewStudioQueryBuilder(nil)

	studios, count := qb.Query(studioFilter, filter)
	return &models.QueryStudiosResultType{
		Studios: studios,
		Count:   count,
	}, nil
}
