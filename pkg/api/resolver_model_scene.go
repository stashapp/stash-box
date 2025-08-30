package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

type sceneResolver struct{ *Resolver }

func (r *sceneResolver) ID(ctx context.Context, obj *models.Scene) (string, error) {
	return obj.ID.String(), nil
}

// Deprecated: use `ReleaseDate`
func (r *sceneResolver) Date(ctx context.Context, obj *models.Scene) (*string, error) {
	ret := resolveFuzzyDate(obj.Date)
	if ret != nil {
		return &ret.Date, nil
	}
	return nil, nil
}

func (r *sceneResolver) ReleaseDate(ctx context.Context, obj *models.Scene) (*string, error) {
	return obj.Date, nil
}

func (r *sceneResolver) Studio(ctx context.Context, obj *models.Scene) (*models.Studio, error) {
	if !obj.StudioID.Valid {
		return nil, nil
	}

	studio, err := dataloader.For(ctx).StudioByID.Load(obj.StudioID.UUID)
	if err != nil {
		return nil, err
	}

	return studio, nil
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

	image.OrderLandscape(images)
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
			As:        appearance.As,
		}
		ret = append(ret, &retApp)
	}

	return ret, nil
}

func (r *sceneResolver) Fingerprints(ctx context.Context, obj *models.Scene, isSubmitted *bool) ([]*models.Fingerprint, error) {
	if isSubmitted != nil && *isSubmitted {
		return dataloader.For(ctx).SubmittedSceneFingerprintsByID.Load(obj.ID)
	}
	return dataloader.For(ctx).SceneFingerprintsByID.Load(obj.ID)
}

func (r *sceneResolver) Urls(ctx context.Context, obj *models.Scene) ([]*models.URL, error) {
	return dataloader.For(ctx).SceneUrlsByID.Load(obj.ID)
}

func (r *sceneResolver) Edits(ctx context.Context, obj *models.Scene) ([]*models.Edit, error) {
	return r.services.Edit().FindBySceneID(ctx, obj.ID)
}

func (r *sceneResolver) Created(ctx context.Context, obj *models.Scene) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *sceneResolver) Updated(ctx context.Context, obj *models.Scene) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}
