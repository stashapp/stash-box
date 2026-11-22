package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

type galleryDraftResolver struct{ *Resolver }

func (r *galleryDraftResolver) Studio(ctx context.Context, obj *models.GalleryDraft) (models.GalleryDraftStudio, error) {
	return r.services.Draft().FindGalleryStudio(ctx, obj.Studio)
}

func (r *galleryDraftResolver) Performers(ctx context.Context, obj *models.GalleryDraft) ([]models.GalleryDraftPerformer, error) {
	return r.services.Draft().FindGalleryPerformers(ctx, obj.Performers)
}

func (r *galleryDraftResolver) Scenes(ctx context.Context, obj *models.GalleryDraft) ([]models.GalleryDraftScene, error) {
	return r.services.Draft().FindGalleryScenes(ctx, obj.Scenes)
}

func (r *galleryDraftResolver) Tags(ctx context.Context, obj *models.GalleryDraft) ([]models.GalleryDraftTag, error) {
	return r.services.Draft().FindGalleryTags(ctx, obj.Tags)
}

func (r *galleryDraftResolver) Cover(ctx context.Context, obj *models.GalleryDraft) (*models.Image, error) {
	if obj.Cover == nil {
		return nil, nil
	}
	return r.services.Image().Find(ctx, *obj.Cover)
}

func (r *galleryDraftResolver) Images(ctx context.Context, obj *models.GalleryDraft) ([]models.GalleryDraftImage, error) {
	result := make([]models.GalleryDraftImage, len(obj.Images))
	for i, image := range obj.Images {
		tags, err := r.services.Draft().FindGalleryImageTags(ctx, image.Tags)
		if err != nil {
			return nil, err
		}
		result[i] = models.GalleryDraftImage{Index: image.Index, Phash: image.PHash, Tags: tags}
	}
	return result, nil
}
