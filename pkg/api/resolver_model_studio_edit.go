package api

import (
	"context"

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
	return imageList(ctx, obj.AddedImages)
}

func (r *studioEditResolver) RemovedImages(ctx context.Context, obj *models.StudioEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.RemovedImages)
}

func (r *studioEditResolver) Images(ctx context.Context, obj *models.StudioEdit) ([]*models.Image, error) {
	fac := r.getRepoFactory(ctx)
	id, err := fac.Edit().FindStudioID(obj.EditID)
	if err != nil {
		return nil, err
	}

	imageIds, err := fac.Studio().GetEditImages(*id, obj)
	if err != nil {
		return nil, err
	}
	images, errs := fac.Image().FindByIds(imageIds)
	if len(errs) > 0 {
		return nil, errs[0]
	}
	return images, nil
}

func (r *studioEditResolver) Urls(ctx context.Context, obj *models.StudioEdit) ([]*models.URL, error) {
	fac := r.getRepoFactory(ctx)
	id, err := fac.Edit().FindStudioID(obj.EditID)
	if err != nil {
		return nil, err
	}

	return fac.Studio().GetEditURLs(*id, obj)
}
