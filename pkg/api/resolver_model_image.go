package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/api/urlbuilders"
	"github.com/stashapp/stashdb/pkg/manager/config"
	"github.com/stashapp/stashdb/pkg/models"
)

type imageResolver struct{ *Resolver }

func (r *imageResolver) ID(ctx context.Context, obj *models.Image) (string, error) {
	return obj.ID.String(), nil
}
func (r *imageResolver) URL(ctx context.Context, obj *models.Image) (string, error) {
	if config.GetImageBackend() == config.LocalBackend {
		baseURL, _ := ctx.Value(BaseURLCtxKey).(string)
		builder := urlbuilders.NewImageURLBuilder(baseURL, obj.Checksum)
		return builder.GetImageURL(), nil
	}

	return obj.RemoteURL.String, nil
}
