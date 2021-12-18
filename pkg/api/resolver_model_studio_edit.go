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

func (r *studioEditResolver) AddedUrls(ctx context.Context, obj *models.StudioEdit) ([]*models.URL, error) {
	return urlList(ctx, obj.AddedUrls)
}

func (r *studioEditResolver) RemovedUrls(ctx context.Context, obj *models.StudioEdit) ([]*models.URL, error) {
	return urlList(ctx, obj.RemovedUrls)
}
