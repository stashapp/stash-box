package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
)

type sceneDraftResolver struct{ *Resolver }

func (r *sceneDraftResolver) ID(ctx context.Context, obj *models.SceneDraft) (*string, error) {
	if obj.ID != nil {
		val := obj.ID.String()
		return &val, nil
	}
	return nil, nil
}

func (r *sceneDraftResolver) Image(ctx context.Context, obj *models.SceneDraft) (*models.Image, error) {
	if obj.Image == nil {
		return nil, nil
	}

	return r.services.Image().Find(ctx, *obj.Image)
}

func (r *sceneDraftResolver) Performers(ctx context.Context, obj *models.SceneDraft) ([]models.SceneDraftPerformer, error) {
	return r.services.Draft().FindPerformers(ctx, obj.Performers)
}

func (r *sceneDraftResolver) Tags(ctx context.Context, obj *models.SceneDraft) ([]models.SceneDraftTag, error) {
	return r.services.Draft().FindTags(ctx, obj.Tags)
}

func (r *sceneDraftResolver) Studio(ctx context.Context, obj *models.SceneDraft) (models.SceneDraftStudio, error) {
	return r.services.Draft().FindStudio(ctx, obj.Studio)
}
