package api

import (
	"context"
	"strconv"

	"github.com/stashapp/stashdb/pkg/models"
)

type sceneResolver struct{ *Resolver }

func (r *sceneResolver) ID(ctx context.Context, obj *models.Scene) (string, error) {
	return strconv.FormatInt(obj.ID, 10), nil
}
func (r *sceneResolver) Title(ctx context.Context, obj *models.Scene) (*string, error) {
	return resolveNullString(obj.Title)
}
func (r *sceneResolver) Details(ctx context.Context, obj *models.Scene) (*string, error) {
	return resolveNullString(obj.Details)
}
func (r *sceneResolver) URL(ctx context.Context, obj *models.Scene) (*string, error) {
	return resolveNullString(obj.URL)
}
func (r *sceneResolver) Date(ctx context.Context, obj *models.Scene) (*string, error) {
	return resolveSQLiteDate(obj.Date)
}
func (r *sceneResolver) Studio(ctx context.Context, obj *models.Scene) (*models.Studio, error) {
	if !obj.StudioID.Valid {
		return nil, nil
	}

	qb := models.NewStudioQueryBuilder(nil)
	parent, err := qb.Find(obj.StudioID.Int64)

	if err != nil {
		return nil, err
	}

	return parent, nil
}
func (r *sceneResolver) Tags(ctx context.Context, obj *models.Scene) ([]*models.Tag, error) {
	qb := models.NewTagQueryBuilder(nil)
	return qb.FindBySceneID(obj.ID)
}
func (r *sceneResolver) Performers(ctx context.Context, obj *models.Scene) ([]*models.PerformerAppearance, error) {
	pqb := models.NewPerformerQueryBuilder(nil)
	sqb := models.NewSceneQueryBuilder(nil)
	performersScenes, err := sqb.GetPerformers(obj.ID)

	if err != nil {
		return nil, err
	}

	// TODO - probably a better way to do this
	var ret []*models.PerformerAppearance
	for _, appearance := range performersScenes {
		performer, err := pqb.Find(appearance.PerformerID)

		if err != nil {
			return nil, err
		}

		as, _ := resolveNullString(appearance.As)

		retApp := models.PerformerAppearance{
			Performer: performer,
			As:        as,
		}
		ret = append(ret, &retApp)
	}

	return ret, nil
}
func (r *sceneResolver) Checksums(ctx context.Context, obj *models.Scene) ([]string, error) {
	qb := models.NewSceneQueryBuilder(nil)
	return qb.GetChecksums(obj.ID)
}
