package api

import (
	"context"
	"strconv"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *queryResolver) FindPerformer(ctx context.Context, id string) (*models.Performer, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewPerformerQueryBuilder(nil)

	idInt, _ := strconv.ParseInt(id, 10, 64)
	return qb.Find(idInt)
}
func (r *queryResolver) QueryPerformers(ctx context.Context, performerFilter *models.PerformerFilterType, filter *models.QuerySpec) (*models.QueryPerformersResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewPerformerQueryBuilder(nil)

	performers, count := qb.Query(performerFilter, filter)
	return &models.QueryPerformersResultType{
		Performers: performers,
		Count:      count,
	}, nil
}
