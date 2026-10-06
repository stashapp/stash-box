package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

func (r *queryResolver) QueryUnorganizedImages(ctx context.Context, input models.UnorganizedImagesQueryInput) (*models.UnorganizedImagesQuery, error) {
	return &models.UnorganizedImagesQuery{
		Filter: input,
	}, nil
}

type queryUnorganizedImagesResolver struct{ *Resolver }

func (r *queryUnorganizedImagesResolver) Count(ctx context.Context, obj *models.UnorganizedImagesQuery) (int, error) {
	return r.services.Image().UnorganizedCount(ctx, obj.Filter)
}

func (r *queryUnorganizedImagesResolver) Images(ctx context.Context, obj *models.UnorganizedImagesQuery) ([]models.UnorganizedImage, error) {
	return r.services.Image().QueryUnorganized(ctx, obj.Filter)
}

type unorganizedImageResolver struct{ *Resolver }

func (r *unorganizedImageResolver) Performer(ctx context.Context, obj *models.UnorganizedImage) (*models.Performer, error) {
	return dataloader.For(ctx).PerformerByID.Load(obj.PerformerID)
}
