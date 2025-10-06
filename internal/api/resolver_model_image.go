package api

import (
	"context"

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
