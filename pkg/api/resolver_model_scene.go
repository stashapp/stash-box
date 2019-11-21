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

	qb := models.NewStudioQueryBuilder()
	parent, err := qb.Find(obj.StudioID.Int64)

	if err != nil {
		return nil, err
	}

	return parent, nil
}
func (r *sceneResolver) Tags(ctx context.Context, obj *models.Scene) ([]*models.Tag, error) {
	qb := models.NewTagQueryBuilder()
	return qb.FindBySceneID(obj.ID, nil)
}
func (r *sceneResolver) Performers(ctx context.Context, obj *models.Scene) ([]*models.PerformerAppearance, error) {
	// TODO
	// qb := models.NewPerformerQueryBuilder()
	// return qb.FindBySceneID(obj.ID, nil)
	return nil, nil
}
func (r *sceneResolver) Checksums(ctx context.Context, obj *models.Scene) ([]string, error) {
	qb := models.NewSceneQueryBuilder()
	return qb.GetChecksums(obj.ID)
}
