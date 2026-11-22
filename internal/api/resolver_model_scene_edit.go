package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

type sceneEditResolver struct{ *Resolver }

func (r *sceneEditResolver) Studio(ctx context.Context, obj *models.SceneEdit) (*models.Studio, error) {
	if obj.StudioID == nil {
		return nil, nil
	}

	return dataloader.For(ctx).StudioByID.Load(*obj.StudioID)
}

func (r *sceneEditResolver) AddedPerformers(ctx context.Context, obj *models.SceneEdit) ([]models.PerformerAppearance, error) {
	return performerAppearanceList(ctx, obj.AddedPerformers)
}

func (r *sceneEditResolver) RemovedPerformers(ctx context.Context, obj *models.SceneEdit) ([]models.PerformerAppearance, error) {
	return performerAppearanceList(ctx, obj.RemovedPerformers)
}

func (r *sceneEditResolver) AddedTags(ctx context.Context, obj *models.SceneEdit) ([]models.Tag, error) {
	return tagList(ctx, obj.AddedTags)
}

func (r *sceneEditResolver) RemovedTags(ctx context.Context, obj *models.SceneEdit) ([]models.Tag, error) {
	return tagList(ctx, obj.RemovedTags)
}

func (r *sceneEditResolver) AddedImages(ctx context.Context, obj *models.SceneEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.AddedImages)
}

func (r *sceneEditResolver) RemovedImages(ctx context.Context, obj *models.SceneEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.RemovedImages)
}

func (r *sceneEditResolver) fingerprintList(ctx context.Context, fingerprints []models.FingerprintInput) ([]models.Fingerprint, error) {
	var ret []models.Fingerprint
	for _, fp := range fingerprints {
		rr := models.Fingerprint{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		}
		ret = append(ret, rr)
	}

	return ret, nil
}

func (r *sceneEditResolver) AddedFingerprints(ctx context.Context, obj *models.SceneEdit) ([]models.Fingerprint, error) {
	return r.fingerprintList(ctx, obj.AddedFingerprints)
}

func (r *sceneEditResolver) RemovedFingerprints(ctx context.Context, obj *models.SceneEdit) ([]models.Fingerprint, error) {
	return r.fingerprintList(ctx, obj.RemovedFingerprints)
}

func (r *sceneEditResolver) Fingerprints(ctx context.Context, obj *models.SceneEdit) ([]models.Fingerprint, error) {
	var ret []models.Fingerprint
	for _, fp := range obj.AddedFingerprints {
		ret = append(ret, models.Fingerprint{
			Hash:          fp.Hash,
			Algorithm:     fp.Algorithm,
			Duration:      fp.Duration,
			Submissions:   0,
			UserSubmitted: true,
		})
	}

	return ret, nil
}

func (r *sceneEditResolver) Images(ctx context.Context, obj *models.SceneEdit) ([]models.Image, error) {
	return r.services.Edit().GetMergedImages(ctx, obj.EditID)
}

func (r *sceneEditResolver) Tags(ctx context.Context, obj *models.SceneEdit) ([]models.Tag, error) {
	return r.services.Edit().GetMergedTags(ctx, obj.EditID)
}

func (r *sceneEditResolver) Performers(ctx context.Context, obj *models.SceneEdit) ([]models.PerformerAppearance, error) {
	return r.services.Edit().GetMergedPerformers(ctx, obj.EditID)
}

func (r *sceneEditResolver) Urls(ctx context.Context, obj *models.SceneEdit) ([]models.URL, error) {
	return r.services.Edit().GetMergedURLs(ctx, obj.EditID)
}
