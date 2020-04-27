package api

import (
	"context"
    "crypto/md5"
    "encoding/hex"

	"github.com/stashapp/stashdb/pkg/models"
)

type imageResolver struct{ *Resolver }

func (r *imageResolver) ID(ctx context.Context, obj *models.Image) (string, error) {
    if obj.Height.Valid && obj.Width.Valid {
        imageID := obj.ID.String()
        height := int(obj.Height.Int64)
        width := int(obj.Width.Int64)

        if width > 1280 || height > 1280 {
            hasher := md5.New()
            hasher.Write([]byte(imageID + "-resized"))
            imageID = hex.EncodeToString(hasher.Sum(nil))
        }

        return imageID, nil
    }
	return obj.ID.String(), nil
}
func (r *imageResolver) URL(ctx context.Context, obj *models.Image) (string, error) {
	return obj.URL, nil
}
func (r *imageResolver) Width(ctx context.Context, obj *models.Image) (*int, error) {
	return resolveNullInt64(obj.Width)
}
func (r *imageResolver) Height(ctx context.Context, obj *models.Image) (*int, error) {
	return resolveNullInt64(obj.Height)
}
