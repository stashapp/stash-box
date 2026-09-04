package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

type imageResolver struct{ *Resolver }

func (r *imageResolver) ID(ctx context.Context, obj *models.Image) (string, error) {
	return obj.ID.String(), nil
}
func (r *imageResolver) URL(ctx context.Context, obj *models.Image) (string, error) {
	baseURL := ctx.Value(BaseURLCtxKey).(string)
	id := obj.ID.String()
	return baseURL + "/images/" + id, nil
}

// Types is dataloader-batched rather than a plain field: an image's labels
// come from a join, unlike its other columns.
func (r *imageResolver) Types(ctx context.Context, obj *models.Image) ([]models.ImageTypeEnum, error) {
	assignments, err := dataloader.For(ctx).ImageTypesByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	types := make([]models.ImageTypeEnum, len(assignments))
	for i, assignment := range assignments {
		types[i] = assignment.Type
	}
	return types, nil
}
