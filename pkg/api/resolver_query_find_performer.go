package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindPerformer(ctx context.Context, id string) (*models.Performer, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()

	idUUID, _ := uuid.FromString(id)
	return qb.Find(idUUID)
}
func (r *queryResolver) QueryPerformers(ctx context.Context, performerFilter *models.PerformerFilterType, filter *models.QuerySpec) (*models.QueryPerformersResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()

	performers, count := qb.Query(performerFilter, filter)
	return &models.QueryPerformersResultType{
		Performers: performers,
		Count:      count,
	}, nil
}
