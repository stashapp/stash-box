package api

import (
	"context"
	"strconv"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *queryResolver) FindScene(ctx context.Context, id string) (*models.Scene, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewSceneQueryBuilder(nil)

	idInt, _ := strconv.ParseInt(id, 10, 64)
	return qb.Find(idInt)
}

func (r *queryResolver) QueryScenes(ctx context.Context, sceneFilter *models.SceneFilterType, filter *models.QuerySpec) (*models.QueryScenesResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewSceneQueryBuilder(nil)

	scenes, count := qb.Query(sceneFilter, filter)
	return &models.QueryScenesResultType{
		Scenes: scenes,
		Count:  count,
	}, nil
}
