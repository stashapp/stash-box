package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/dataloader"
	"github.com/stashapp/stashdb/pkg/models"
)

type sceneResolver struct{ *Resolver }

func (r *sceneResolver) ID(ctx context.Context, obj *models.Scene) (string, error) {
	return obj.ID.String(), nil
}

func (r *sceneResolver) Title(ctx context.Context, obj *models.Scene) (*string, error) {
	return resolveNullString(obj.Title), nil
}

func (r *sceneResolver) Details(ctx context.Context, obj *models.Scene) (*string, error) {
	return resolveNullString(obj.Details), nil
}

func (r *sceneResolver) Duration(ctx context.Context, obj *models.Scene) (*int, error) {
	return resolveNullInt64(obj.Duration)
}

func (r *sceneResolver) Director(ctx context.Context, obj *models.Scene) (*string, error) {
	return resolveNullString(obj.Director), nil
}

func (r *sceneResolver) Date(ctx context.Context, obj *models.Scene) (*string, error) {
	return resolveSQLiteDate(obj.Date)
}

func (r *sceneResolver) Studio(ctx context.Context, obj *models.Scene) (*models.Studio, error) {
	if !obj.StudioID.Valid {
		return nil, nil
	}

	qb := models.NewStudioQueryBuilder(nil)
	parent, err := qb.Find(obj.StudioID.UUID)

	if err != nil {
		return nil, err
	}

	return parent, nil
}

func (r *sceneResolver) Tags(ctx context.Context, obj *models.Scene) ([]*models.Tag, error) {
	qb := models.NewTagQueryBuilder(nil)
	return qb.FindBySceneID(obj.ID)
}

func (r *sceneResolver) Images(ctx context.Context, obj *models.Scene) ([]*models.Image, error) {
	imageIDs, _ := dataloader.For(ctx).SceneImageIDsById.Load(obj.ID)
	images, _ := dataloader.For(ctx).ImageById.LoadAll(imageIDs)
	return images, nil
}

func (r *sceneResolver) Performers(ctx context.Context, obj *models.Scene) ([]*models.PerformerAppearance, error) {
	appearances, _ := dataloader.For(ctx).SceneAppearancesById.Load(obj.ID)

	// TODO - probably a better way to do this
	var ret []*models.PerformerAppearance
	for _, appearance := range appearances {
		performer, err := dataloader.For(ctx).PerformerById.Load(appearance.PerformerID)

		if err != nil {
			return nil, err
		}

		retApp := models.PerformerAppearance{
			Performer: performer,
			As:        resolveNullString(appearance.As),
		}
		ret = append(ret, &retApp)
	}

	return ret, nil
}
func (r *sceneResolver) Fingerprints(ctx context.Context, obj *models.Scene) ([]*models.Fingerprint, error) {
	qb := models.NewSceneQueryBuilder(nil)
	return qb.GetFingerprints(obj.ID)
}

func (r *sceneResolver) Urls(ctx context.Context, obj *models.Scene) ([]*models.URL, error) {
	return dataloader.For(ctx).SceneUrlsById.Load(obj.ID)
}
