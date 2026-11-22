package api

import (
	"context"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

func (r *mutationResolver) GalleryCreate(ctx context.Context, input models.GalleryCreateInput) (*models.Gallery, error) {
	return r.services.Gallery().Create(ctx, input)
}

func (r *mutationResolver) GalleryUpdate(ctx context.Context, input models.GalleryUpdateInput) (*models.Gallery, error) {
	service := r.services.Gallery()
	gallery, err := service.FindByID(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	args := utils.Arguments(ctx).Field("input")
	if input.Title != nil || args.Field("title").IsNull() {
		gallery.Title = input.Title
	}
	if input.Code != nil || args.Field("code").IsNull() {
		gallery.Code = input.Code
	}
	if input.Date != nil || args.Field("date").IsNull() {
		if input.Date != nil && *input.Date != "" {
			if _, err := time.Parse("2006-01-02", *input.Date); err != nil {
				return nil, fmt.Errorf("gallery date must use YYYY-MM-DD: %w", err)
			}
		}
		gallery.Date = input.Date
	}
	if input.Photographer != nil || args.Field("photographer").IsNull() {
		gallery.Photographer = input.Photographer
	}
	if input.Details != nil || args.Field("details").IsNull() {
		gallery.Details = input.Details
	}
	if input.StudioID != nil || args.Field("studio_id").IsNull() {
		gallery.StudioID = nullableGalleryUUID(input.StudioID)
	}
	if input.CoverImageID != nil || args.Field("cover_image_id").IsNull() {
		gallery.CoverImageID = nullableGalleryUUID(input.CoverImageID)
	}

	urls := input.URLs
	if urls == nil && !args.Field("urls").IsNull() {
		urls, err = service.GetURLs(ctx, input.ID)
		if err != nil {
			return nil, err
		}
	}
	performers := input.Performers
	if performers == nil && !args.Field("performers").IsNull() {
		appearances, err := service.GetPerformers(ctx, input.ID)
		if err != nil {
			return nil, err
		}
		performers = make([]models.PerformerAppearanceInput, len(appearances))
		for i := range appearances {
			performers[i] = models.PerformerAppearanceInput{PerformerID: appearances[i].PerformerID, As: appearances[i].As}
		}
	}
	tagIDs := input.TagIDs
	if tagIDs == nil && !args.Field("tag_ids").IsNull() {
		tagIDs, err = service.GetTags(ctx, input.ID)
		if err != nil {
			return nil, err
		}
	}
	sceneIDs := input.SceneIDs
	if sceneIDs == nil && !args.Field("scene_ids").IsNull() {
		sceneIDs, err = service.GetScenes(ctx, input.ID)
		if err != nil {
			return nil, err
		}
	}
	if err := service.Replace(ctx, gallery, urls, performers, tagIDs, sceneIDs); err != nil {
		return nil, err
	}
	return service.FindByID(ctx, input.ID)
}

func nullableGalleryUUID(id *uuid.UUID) uuid.NullUUID {
	if id == nil {
		return uuid.NullUUID{}
	}
	return uuid.NullUUID{UUID: *id, Valid: true}
}

func (r *mutationResolver) GalleryDestroy(ctx context.Context, input models.GalleryDestroyInput) (bool, error) {
	err := r.services.Gallery().Delete(ctx, input.ID)
	return err == nil, err
}

func (r *mutationResolver) GalleryImageRepair(ctx context.Context, input models.GalleryImageRepairInput) (bool, error) {
	image, err := r.services.Gallery().FindImageByGalleryIndex(ctx, input.GalleryID, input.Index)
	if err != nil {
		return false, err
	}
	if _, err := r.services.Gallery().ReplaceImagePHash(ctx, image.ID, input.Phash); err != nil {
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) GalleryImageDelete(ctx context.Context, input models.GalleryImageDeleteInput) (bool, error) {
	image, err := r.services.Gallery().FindImageByGalleryIndex(ctx, input.GalleryID, input.Index)
	if err != nil {
		return false, fmt.Errorf("find gallery image: %w", err)
	}
	err = r.services.Gallery().DeleteImage(ctx, image.ID)
	return err == nil, err
}
