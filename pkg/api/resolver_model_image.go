package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/api/urlbuilders"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

type imageResolver struct{ *Resolver }

func (r *imageResolver) ID(_ context.Context, obj *models.Image) (string, error) {
	return obj.ID.String(), nil
}
func (r *imageResolver) URL(ctx context.Context, obj *models.Image) (string, error) {
	if config.GetImageBackend() == config.FileBackend {
		baseURL, _ := ctx.Value(BaseURLCtxKey).(string)
		builder := urlbuilders.NewImageURLBuilder(baseURL, obj.Checksum)
		return builder.GetImageURL(), nil
	} else if config.GetImageBackend() == config.S3Backend {
		builder := urlbuilders.NewS3ImageURLBuilder(obj)
		return builder.GetImageURL(), nil
	}

	return obj.RemoteURL.String, nil
}

func imageList(ctx context.Context, imageIDs []string) ([]*models.Image, error) {
	if len(imageIDs) == 0 {
		return nil, nil
	}

	var uuids []uuid.UUID
	for _, id := range imageIDs {
		imageID, _ := uuid.FromString(id)
		uuids = append(uuids, imageID)
	}
	images, errors := dataloader.For(ctx).ImageByID.LoadAll(uuids)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return images, nil
}
