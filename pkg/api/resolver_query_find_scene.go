package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *queryResolver) FindScene(ctx context.Context, id *string, checksum *string) (*models.Scene, error) {
	panic("not implemented")
}
func (r *queryResolver) QueryScenes(ctx context.Context, sceneFilter *models.SceneFilterType, filter *models.QuerySpec) (*models.QueryScenesResultType, error) {
	panic("not implemented")
}

// func (r *queryResolver) FindScene(ctx context.Context, id string) (*models.Scene, error) {
// 	if err := validateRead(ctx); err != nil {
// 		return nil, err
// 	}

// 	qb := models.NewSceneQueryBuilder()
// 	idInt, _ := strconv.Atoi(id)
// 	var scene *models.Scene
// 	var err error
// 	scene, err = qb.Find(idInt)
// 	return scene, err
// }

// func (r *queryResolver) FindSceneByChecksum(ctx context.Context, checksum string) (*models.Scene, error) {
// 	if err := validateRead(ctx); err != nil {
// 		return nil, err
// 	}

// 	qb := models.NewSceneQueryBuilder()
// 	var scene *models.Scene
// 	var err error
// 	scene, err = qb.FindByChecksum(checksum)
// 	return scene, err
// }
