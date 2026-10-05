package api

import (
	"context"
	"errors"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/image"
	"github.com/stashapp/stash-box/internal/models"
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

func (r *sceneResolver) Tags(ctx context.Context, obj *models.Scene) ([]models.Tag, error) {
	tagIDs, err := dataloader.For(ctx).SceneTagIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}
	return tagList(ctx, tagIDs)
}

func (r *sceneResolver) Images(ctx context.Context, obj *models.Scene) ([]models.Image, error) {
	imageIDs, err := dataloader.For(ctx).SceneImageIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	images, err := imageList(ctx, imageIDs)
	image.OrderLandscape(images)
	return images, err
}

func (r *sceneResolver) Performers(ctx context.Context, obj *models.Scene) ([]models.PerformerAppearance, error) {
	appearances, err := dataloader.For(ctx).SceneAppearancesByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	performerIDs := make([]uuid.UUID, len(appearances))
	for i, appearance := range appearances {
		performerIDs[i] = appearance.PerformerID
	}

	performers, errs := dataloader.For(ctx).PerformerByID.LoadAll(performerIDs)
	if err := errors.Join(errs...); err != nil {
		return nil, err
	}

	ret := make([]models.PerformerAppearance, len(appearances))
	for i, appearance := range appearances {
		ret[i] = models.PerformerAppearance{
			Performer: performers[i],
			As:        appearance.As,
		}
	}

	return ret, nil
}

func (r *sceneResolver) Fingerprints(ctx context.Context, obj *models.Scene, isSubmitted *bool) ([]models.Fingerprint, error) {
	if isSubmitted != nil && *isSubmitted {
		return dataloader.For(ctx).SubmittedSceneFingerprintsByID.Load(obj.ID)
	}
	return dataloader.For(ctx).SceneFingerprintsByID.Load(obj.ID)
}

func (r *sceneResolver) Urls(ctx context.Context, obj *models.Scene) ([]models.URL, error) {
	return dataloader.For(ctx).SceneUrlsByID.Load(obj.ID)
}

func (r *sceneResolver) Edits(ctx context.Context, obj *models.Scene) ([]models.Edit, error) {
	return dataloader.For(ctx).SceneEditsByID.Load(obj.ID)
}

func (r *sceneResolver) Created(ctx context.Context, obj *models.Scene) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *sceneResolver) Updated(ctx context.Context, obj *models.Scene) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}
