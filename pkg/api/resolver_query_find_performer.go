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

	qb := models.NewPerformerQueryBuilder()

	idInt, _ := strconv.Atoi(id)
	return qb.Find(idInt)
}
func (r *queryResolver) QueryPerformers(ctx context.Context, performerFilter *models.PerformerFilterType, filter *models.QuerySpec) (*models.QueryPerformersResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewPerformerQueryBuilder()

	performers, count := qb.Query(performerFilter, filter)
	return &models.QueryPerformersResultType{
		Performers: performers,
		Count:      count,
	}, nil
}
