package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindPerformer(ctx context.Context, id uuid.UUID) (*models.Performer, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()

	return qb.Find(id)
}

func (r *queryResolver) QueryPerformers(ctx context.Context, performerFilter *models.PerformerFilterType, filter *models.QuerySpec) (*models.PerformerQuery, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	return &models.PerformerQuery{
		PerformerFilter: performerFilter,
		Filter:          filter,
	}, nil
}

type queryPerformerResolver struct{ *Resolver }

func (r *queryPerformerResolver) Count(ctx context.Context, obj *models.PerformerQuery) (int, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()
	return qb.QueryCount(obj.PerformerFilter, obj.Filter)
}

func (r *queryPerformerResolver) Performers(ctx context.Context, obj *models.PerformerQuery) ([]*models.Performer, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()
	return qb.QueryPerformers(obj.PerformerFilter, obj.Filter)
}
