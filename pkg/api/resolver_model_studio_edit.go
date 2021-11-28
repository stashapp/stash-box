package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type studioEditResolver struct{ *Resolver }

func (r *studioEditResolver) Parent(ctx context.Context, obj *models.StudioEdit) (*models.Studio, error) {
	if obj.ParentID == nil {
		return nil, nil
	}

	qb := r.getRepoFactory(ctx).Studio()
	parent, err := qb.Find(*obj.ParentID)

	if err != nil {
		return nil, err
	}

	return parent, nil
}

func (r *studioEditResolver) AddedImages(ctx context.Context, obj *models.StudioEdit) ([]*models.Image, error) {
	if len(obj.AddedImages) == 0 {
		return nil, nil
	}

	images, errors := dataloader.For(ctx).ImageByID.LoadAll(obj.AddedImages)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return images, nil
}

func (r *studioEditResolver) RemovedImages(ctx context.Context, obj *models.StudioEdit) ([]*models.Image, error) {
	if len(obj.RemovedImages) == 0 {
		return nil, nil
	}

	images, errors := dataloader.For(ctx).ImageByID.LoadAll(obj.RemovedImages)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return images, nil
}
