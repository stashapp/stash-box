package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *queryResolver) SearchPerformer(ctx context.Context, term string) ([]*models.Performer, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewPerformerQueryBuilder(nil)

	return qb.SearchPerformers(term)
}

func (r *queryResolver) SearchScene(ctx context.Context, term string) ([]*models.Scene, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewSceneQueryBuilder(nil)

	return qb.SearchScenes(term)
}
