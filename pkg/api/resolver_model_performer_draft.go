package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
)

type performerDraftResolver struct{ *Resolver }

func (r *performerDraftResolver) Image(ctx context.Context, obj *models.PerformerDraft) (*models.Image, error) {
	if obj.Image == nil {
		return nil, nil
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Image()
	return qb.Find(*obj.Image)
}
