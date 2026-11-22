package api

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

type galleryEditResolver struct{ *Resolver }

func (r *galleryEditResolver) Studio(ctx context.Context, obj *models.GalleryEdit) (*models.Studio, error) {
	if obj.StudioID == nil {
		return nil, nil
	}
	return dataloader.For(ctx).StudioByID.Load(*obj.StudioID)
}
func (r *galleryEditResolver) AddedPerformers(ctx context.Context, obj *models.GalleryEdit) ([]models.PerformerAppearance, error) {
	return performerAppearanceList(ctx, obj.AddedPerformers)
}
func (r *galleryEditResolver) RemovedPerformers(ctx context.Context, obj *models.GalleryEdit) ([]models.PerformerAppearance, error) {
	return performerAppearanceList(ctx, obj.RemovedPerformers)
}
func (r *galleryEditResolver) AddedScenes(ctx context.Context, obj *models.GalleryEdit) ([]models.Scene, error) {
	return r.scenes(ctx, obj.AddedScenes)
}
func (r *galleryEditResolver) RemovedScenes(ctx context.Context, obj *models.GalleryEdit) ([]models.Scene, error) {
	return r.scenes(ctx, obj.RemovedScenes)
}
func (r *galleryEditResolver) AddedTags(ctx context.Context, obj *models.GalleryEdit) ([]models.Tag, error) {
	return tagList(ctx, obj.AddedTags)
}
func (r *galleryEditResolver) RemovedTags(ctx context.Context, obj *models.GalleryEdit) ([]models.Tag, error) {
	return tagList(ctx, obj.RemovedTags)
}
func (r *galleryEditResolver) Cover(ctx context.Context, obj *models.GalleryEdit) (*models.Image, error) {
	if obj.CoverImageID == nil {
		return nil, nil
	}
	return dataloader.For(ctx).ImageByID.Load(*obj.CoverImageID)
}
func (r *galleryEditResolver) Images(ctx context.Context, obj *models.GalleryEdit) ([]models.GalleryImage, error) {
	if len(obj.Images) == 0 {
		target, err := r.services.Edit().GetGalleryEditTargetID(ctx, obj.EditID)
		if errors.Is(err, pgx.ErrNoRows) {
			return []models.GalleryImage{}, nil
		}
		if err != nil {
			return nil, err
		}
		images, err := r.services.Gallery().GetImages(ctx, target)
		if err != nil {
			return nil, err
		}
		for i := range images {
			for _, update := range obj.ImageTagUpdates {
				if images[i].Index != update.Index {
					continue
				}
				removed := make(map[uuid.UUID]bool, len(update.RemovedTags))
				for _, id := range update.RemovedTags {
					removed[id] = true
				}
				existing := make(map[uuid.UUID]bool)
				for _, tag := range images[i].Tags {
					if tag.TagID != nil && !removed[*tag.TagID] {
						existing[*tag.TagID] = true
					}
				}
				images[i].Tags = images[i].Tags[:0]
				for id := range existing {
					id := id
					images[i].Tags = append(images[i].Tags, models.GalleryImageTag{TagID: &id})
				}
				for _, id := range update.AddedTags {
					if !existing[id] {
						id := id
						images[i].Tags = append(images[i].Tags, models.GalleryImageTag{TagID: &id})
					}
				}
			}
		}
		return images, nil
	}
	result := make([]models.GalleryImage, len(obj.Images))
	for i, image := range obj.Images {
		result[i] = models.GalleryImage{Index: image.Index, PHash: image.PHash}
		for _, tag := range image.Tags {
			if tag.TagID != nil {
				result[i].Tags = append(result[i].Tags, models.GalleryImageTag{TagID: tag.TagID})
			}
		}
	}
	return result, nil
}
func (r *galleryEditResolver) ImageTagUpdates(ctx context.Context, obj *models.GalleryEdit) ([]models.GalleryImageTagEdit, error) {
	result := make([]models.GalleryImageTagEdit, len(obj.ImageTagUpdates))
	for i, update := range obj.ImageTagUpdates {
		added, err := tagList(ctx, update.AddedTags)
		if err != nil {
			return nil, err
		}
		removed, err := tagList(ctx, update.RemovedTags)
		if err != nil {
			return nil, err
		}
		result[i] = models.GalleryImageTagEdit{Index: update.Index, AddedTags: added, RemovedTags: removed}
	}
	return result, nil
}
func (r *galleryEditResolver) scenes(ctx context.Context, ids []uuid.UUID) ([]models.Scene, error) {
	loaded, errs := dataloader.For(ctx).SceneByID.LoadAll(ids)
	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}
	return pruneNils(loaded), nil
}
func (r *galleryEditResolver) Urls(ctx context.Context, obj *models.GalleryEdit) ([]models.URL, error) {
	return r.services.Edit().GetMergedURLs(ctx, obj.EditID)
}
func (r *galleryEditResolver) Performers(ctx context.Context, obj *models.GalleryEdit) ([]models.PerformerAppearance, error) {
	return r.services.Edit().GetMergedPerformers(ctx, obj.EditID)
}
func (r *galleryEditResolver) Tags(ctx context.Context, obj *models.GalleryEdit) ([]models.Tag, error) {
	return r.services.Edit().GetMergedTags(ctx, obj.EditID)
}
func (r *galleryEditResolver) Scenes(ctx context.Context, obj *models.GalleryEdit) ([]models.Scene, error) {
	target, err := r.services.Edit().GetMergedGallerySceneIDs(ctx, obj.EditID)
	if err != nil {
		return nil, err
	}
	return r.scenes(ctx, target)
}
