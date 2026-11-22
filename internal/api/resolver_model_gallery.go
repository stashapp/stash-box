package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

type galleryResolver struct{ *Resolver }

func (r *galleryResolver) Urls(ctx context.Context, obj *models.Gallery) ([]models.URL, error) {
	return r.services.Gallery().GetURLs(ctx, obj.ID)
}

func (r *galleryResolver) Studio(ctx context.Context, obj *models.Gallery) (*models.Studio, error) {
	if !obj.StudioID.Valid {
		return nil, nil
	}
	return dataloader.For(ctx).StudioByID.Load(obj.StudioID.UUID)
}

func (r *galleryResolver) Performers(ctx context.Context, obj *models.Gallery) ([]models.PerformerAppearance, error) {
	relations, err := r.services.Gallery().GetPerformers(ctx, obj.ID)
	if err != nil {
		return nil, err
	}
	appearances := make([]models.PerformerAppearanceInput, len(relations))
	for i := range relations {
		appearances[i] = models.PerformerAppearanceInput{
			PerformerID: relations[i].PerformerID,
			As:          relations[i].As,
		}
	}
	return performerAppearanceList(ctx, appearances)
}

func (r *galleryResolver) Scenes(ctx context.Context, obj *models.Gallery) ([]models.Scene, error) {
	ids, err := r.services.Gallery().GetScenes(ctx, obj.ID)
	if err != nil {
		return nil, err
	}
	loaded, errs := dataloader.For(ctx).SceneByID.LoadAll(ids)
	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}
	return pruneNils(loaded), nil
}

func (r *galleryResolver) Tags(ctx context.Context, obj *models.Gallery) ([]models.Tag, error) {
	ids, err := r.services.Gallery().GetTags(ctx, obj.ID)
	if err != nil {
		return nil, err
	}
	return tagList(ctx, ids)
}

func (r *galleryResolver) Cover(ctx context.Context, obj *models.Gallery) (*models.Image, error) {
	if !obj.CoverImageID.Valid {
		return nil, nil
	}
	return dataloader.For(ctx).ImageByID.Load(obj.CoverImageID.UUID)
}

func (r *galleryResolver) Images(ctx context.Context, obj *models.Gallery) ([]models.GalleryImage, error) {
	return r.services.Gallery().GetImages(ctx, obj.ID)
}

func (r *galleryResolver) ImageCount(ctx context.Context, obj *models.Gallery) (int, error) {
	return r.services.Gallery().CountImages(ctx, obj.ID)
}

func (r *galleryResolver) Edits(ctx context.Context, obj *models.Gallery) ([]models.Edit, error) {
	return r.services.Gallery().GetEdits(ctx, obj.ID)
}

func (r *galleryResolver) Created(ctx context.Context, obj *models.Gallery) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *galleryResolver) Updated(ctx context.Context, obj *models.Gallery) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}

type galleryImageResolver struct{ *Resolver }

func (r *galleryImageResolver) Tags(ctx context.Context, obj *models.GalleryImage) ([]models.Tag, error) {
	ids := make([]uuid.UUID, 0, len(obj.Tags))
	for _, tag := range obj.Tags {
		if tag.TagID != nil {
			ids = append(ids, *tag.TagID)
		}
	}
	return tagList(ctx, ids)
}
