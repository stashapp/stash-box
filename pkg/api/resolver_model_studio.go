package api

import (
	"context"
	"sort"
	"time"

	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type studioResolver struct{ *Resolver }

func (r *studioResolver) ID(ctx context.Context, obj *models.Studio) (string, error) {
	return obj.ID.String(), nil
}

func (r *studioResolver) Urls(ctx context.Context, obj *models.Studio) ([]models.URL, error) {
	return dataloader.For(ctx).StudioUrlsByID.Load(obj.ID)
}

func (r *studioResolver) Parent(ctx context.Context, obj *models.Studio) (*models.Studio, error) {
	if !obj.ParentStudioID.Valid {
		return nil, nil
	}

	return r.services.Studio().FindByID(ctx, obj.ParentStudioID.UUID)
}

func (r *studioResolver) ChildStudios(ctx context.Context, obj *models.Studio) ([]models.Studio, error) {
	return r.services.Studio().FindByParentID(ctx, obj.ID)
}

func (r *studioResolver) Images(ctx context.Context, obj *models.Studio) ([]models.Image, error) {
	imageIDs, err := dataloader.For(ctx).StudioImageIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}
	return imageList(ctx, imageIDs)
}

func (r *studioResolver) IsFavorite(ctx context.Context, obj *models.Studio) (bool, error) {
	return dataloader.For(ctx).StudioIsFavoriteByID.Load(obj.ID)
}

func (r *studioResolver) Created(ctx context.Context, obj *models.Studio) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *studioResolver) Updated(ctx context.Context, obj *models.Studio) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}

func (r *studioResolver) Performers(ctx context.Context, obj *models.Studio, input models.PerformerQueryInput) (*models.PerformerQuery, error) {
	input.StudioID = &obj.ID
	return &models.PerformerQuery{
		Filter: input,
	}, nil
}

func (r *studioResolver) Aliases(ctx context.Context, obj *models.Studio) ([]string, error) {
	aliases, err := dataloader.For(ctx).StudioAliasesByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	sort.Strings(aliases)

	return aliases, nil
}
