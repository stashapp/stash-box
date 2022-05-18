package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
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

func (r *sceneResolver) Code(ctx context.Context, obj *models.Scene) (*string, error) {
	return resolveNullString(obj.Code), nil
}

// Deprecated: use `DateFuzzy`
func (r *sceneResolver) Date(ctx context.Context, obj *models.Scene) (*string, error) {
	return &obj.ResolveDate().Date, nil
}

func (r *sceneResolver) ReleaseDate(ctx context.Context, obj *models.Scene) (*string, error) {
	if !obj.Date.Valid || !obj.DateAccuracy.Valid {
		return nil, nil
	}
	accuracy := models.DateAccuracyEnum(obj.DateAccuracy.String)
	if accuracy == models.DateAccuracyEnumDay {
		return &obj.Date.String, nil
	} else if accuracy == models.DateAccuracyEnumMonth {
		res := obj.Date.String[:7]
		return &res, nil
	} else {
		res := obj.Date.String[:4]
		return &res, nil
	}
}

func (r *sceneResolver) Studio(ctx context.Context, obj *models.Scene) (*models.Studio, error) {
	if !obj.StudioID.Valid {
		return nil, nil
	}

	qb := r.getRepoFactory(ctx).Studio()
	parent, err := qb.Find(obj.StudioID.UUID)

	if err != nil {
		return nil, err
	}

	return parent, nil
}

func (r *sceneResolver) Tags(ctx context.Context, obj *models.Scene) ([]*models.Tag, error) {
	tagIDs, err := dataloader.For(ctx).SceneTagIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}
	tags, errors := dataloader.For(ctx).TagByID.LoadAll(tagIDs)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return tags, nil
}

func (r *sceneResolver) Images(ctx context.Context, obj *models.Scene) ([]*models.Image, error) {
	imageIDs, err := dataloader.For(ctx).SceneImageIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}
	images, errors := dataloader.For(ctx).ImageByID.LoadAll(imageIDs)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}

	models.Images(images).OrderLandscape()
	return images, nil
}

func (r *sceneResolver) Performers(ctx context.Context, obj *models.Scene) ([]*models.PerformerAppearance, error) {
	appearances, err := dataloader.For(ctx).SceneAppearancesByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	var ret []*models.PerformerAppearance
	for _, appearance := range appearances {
		performer, err := dataloader.For(ctx).PerformerByID.Load(appearance.PerformerID)
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
	return dataloader.For(ctx).SceneFingerprintsByID.Load(obj.ID)
}

func (r *sceneResolver) Urls(ctx context.Context, obj *models.Scene) ([]*models.URL, error) {
	return dataloader.For(ctx).SceneUrlsByID.Load(obj.ID)
}

func (r *sceneResolver) Edits(ctx context.Context, obj *models.Scene) ([]*models.Edit, error) {
	eqb := r.getRepoFactory(ctx).Edit()
	return eqb.FindBySceneID(obj.ID)
}

func (r *sceneResolver) Created(ctx context.Context, obj *models.Scene) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *sceneResolver) Updated(ctx context.Context, obj *models.Scene) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}
