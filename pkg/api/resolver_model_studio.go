package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type studioResolver struct{ *Resolver }

func (r *studioResolver) ID(ctx context.Context, obj *models.Studio) (string, error) {
	return obj.ID.String(), nil
}

func (r *studioResolver) Urls(ctx context.Context, obj *models.Studio) ([]*models.URL, error) {
	return dataloader.For(ctx).StudioUrlsByID.Load(obj.ID)
}

func (r *studioResolver) Parent(ctx context.Context, obj *models.Studio) (*models.Studio, error) {
	if !obj.ParentStudioID.Valid {
		return nil, nil
	}

	qb := models.NewStudioQueryBuilder(nil)
	parent, err := qb.Find(obj.ParentStudioID.UUID)

	if err != nil {
		return nil, err
	}

	return parent, nil
}

func (r *studioResolver) ChildStudios(ctx context.Context, obj *models.Studio) ([]*models.Studio, error) {
	qb := models.NewStudioQueryBuilder(nil)
	children, err := qb.FindByParentID(obj.ID)

	if err != nil {
		return nil, err
	}

	return children, nil
}
func (r *studioResolver) Images(ctx context.Context, obj *models.Studio) ([]*models.Image, error) {
	imageIDs, err := dataloader.For(ctx).StudioImageIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}
	images, errors := dataloader.For(ctx).ImageByID.LoadAll(imageIDs)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return images, nil
}
