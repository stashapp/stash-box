package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type imageResolver struct{ *Resolver }

func (r *imageResolver) ID(ctx context.Context, obj *models.Image) (string, error) {
	return obj.ID.String(), nil
}
func (r *imageResolver) URL(ctx context.Context, obj *models.Image) (string, error) {
	//baseURL := ctx.Value(BaseURLCtxKey).(string)
	baseURL := "http://venus"
	id := obj.ID.String()
	return baseURL + "/images/" + id, nil
}

func imageList(ctx context.Context, imageIDs []uuid.UUID) ([]*models.Image, error) {
	if len(imageIDs) == 0 {
		return nil, nil
	}

	images, errors := dataloader.For(ctx).ImageByID.LoadAll(imageIDs)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return images, nil
}
