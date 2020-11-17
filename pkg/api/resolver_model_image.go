package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/api/urlbuilders"
	"github.com/stashapp/stashdb/pkg/models"
)

type imageResolver struct{ *Resolver }

func (r *imageResolver) ID(ctx context.Context, obj *models.Image) (string, error) {
	return obj.ID.String(), nil
}
func (r *imageResolver) URL(ctx context.Context, obj *models.Image) (string, error) {
	// if checksum is populated, then generate a URL, otherwise use the URL
	if obj.Checksum.Valid {
		baseURL, _ := ctx.Value(BaseURLCtxKey).(string)
		builder := urlbuilders.NewImageURLBuilder(baseURL, obj.Checksum.String)
		return builder.GetImageURL(), nil
	}

	return obj.RemoteURL, nil
}
func (r *imageResolver) Width(ctx context.Context, obj *models.Image) (*int, error) {
	return resolveNullInt64(obj.Width)
}
func (r *imageResolver) Height(ctx context.Context, obj *models.Image) (*int, error) {
	return resolveNullInt64(obj.Height)
}
