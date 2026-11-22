package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
)

type galleryImageInputResolver struct{ *Resolver }

func (r *galleryImageInputResolver) TagIds(ctx context.Context, obj *models.GalleryImageInput, ids []uuid.UUID) error {
	obj.Tags = make([]models.GalleryImageTagInput, len(ids))
	for i := range ids {
		id := ids[i]
		obj.Tags[i] = models.GalleryImageTagInput{TagID: &id}
	}
	return nil
}
