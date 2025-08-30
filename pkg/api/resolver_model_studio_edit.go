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

	return r.services.Studio().FindByID(ctx, *obj.ParentID)
}

func (r *studioEditResolver) AddedImages(ctx context.Context, obj *models.StudioEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.AddedImages)
}

func (r *studioEditResolver) RemovedImages(ctx context.Context, obj *models.StudioEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.RemovedImages)
}

func (r *studioEditResolver) Images(ctx context.Context, obj *models.StudioEdit) ([]*models.Image, error) {
	return r.services.Edit().GetMergedImages(ctx, obj.EditID)
}

func (r *studioEditResolver) Urls(ctx context.Context, obj *models.StudioEdit) ([]*models.URL, error) {
	return r.services.Edit().GetMergedURLs(ctx, obj.EditID)
}
