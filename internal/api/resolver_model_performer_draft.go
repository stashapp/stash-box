package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

type performerDraftResolver struct{ *Resolver }

func (r *performerDraftResolver) ID(ctx context.Context, obj *models.PerformerDraft) (*string, error) {
	if obj.ID != nil {
		val := obj.ID.String()
		return &val, nil
	}
	return nil, nil
}

func (r *performerDraftResolver) Image(ctx context.Context, obj *models.PerformerDraft) (*models.Image, error) {
	if obj.Image == nil {
		return nil, nil
	}

	return r.services.Image().Find(ctx, *obj.Image)
}
