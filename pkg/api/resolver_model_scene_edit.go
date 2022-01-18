package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type sceneEditResolver struct{ *Resolver }

func (r *sceneEditResolver) Studio(ctx context.Context, obj *models.SceneEdit) (*models.Studio, error) {
	if obj.StudioID == nil {
		return nil, nil
	}

	qb := r.getRepoFactory(ctx).Studio()
	studio, err := qb.Find(*obj.StudioID)

	if err != nil {
		return nil, err
	}

	return studio, nil
}

func (r *sceneEditResolver) performerAppearanceList(ctx context.Context, performers []*models.PerformerAppearanceInput) ([]*models.PerformerAppearance, error) {
	if len(performers) == 0 {
		return nil, nil
	}

	var uuids []uuid.UUID
	for _, p := range performers {
		uuids = append(uuids, p.PerformerID)
	}
	loadedPerformers, errors := dataloader.For(ctx).PerformerByID.LoadAll(uuids)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}

	var ret []*models.PerformerAppearance
	for i, p := range performers {
		rr := &models.PerformerAppearance{
			Performer: loadedPerformers[i],
			As:        p.As,
		}
		ret = append(ret, rr)
	}

	return ret, nil
}

func (r *sceneEditResolver) AddedPerformers(ctx context.Context, obj *models.SceneEdit) ([]*models.PerformerAppearance, error) {
	return r.performerAppearanceList(ctx, obj.AddedPerformers)
}

func (r *sceneEditResolver) RemovedPerformers(ctx context.Context, obj *models.SceneEdit) ([]*models.PerformerAppearance, error) {
	return r.performerAppearanceList(ctx, obj.RemovedPerformers)
}

func (r *sceneEditResolver) tagList(ctx context.Context, tagIDs []uuid.UUID) ([]*models.Tag, error) {
	if len(tagIDs) == 0 {
		return nil, nil
	}

	tags, errors := dataloader.For(ctx).TagByID.LoadAll(tagIDs)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return tags, nil
}

func (r *sceneEditResolver) AddedTags(ctx context.Context, obj *models.SceneEdit) ([]*models.Tag, error) {
	return r.tagList(ctx, obj.AddedTags)
}

func (r *sceneEditResolver) RemovedTags(ctx context.Context, obj *models.SceneEdit) ([]*models.Tag, error) {
	return r.tagList(ctx, obj.RemovedTags)
}

func (r *sceneEditResolver) AddedImages(ctx context.Context, obj *models.SceneEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.AddedImages)
}

func (r *sceneEditResolver) RemovedImages(ctx context.Context, obj *models.SceneEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.RemovedImages)
}

func (r *sceneEditResolver) fingerprintList(ctx context.Context, fingerprints []*models.FingerprintInput) ([]*models.Fingerprint, error) {
	var ret []*models.Fingerprint
	for _, fp := range fingerprints {
		rr := &models.Fingerprint{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		}
		ret = append(ret, rr)
	}

	return ret, nil
}

func (r *sceneEditResolver) AddedFingerprints(ctx context.Context, obj *models.SceneEdit) ([]*models.Fingerprint, error) {
	return r.fingerprintList(ctx, obj.AddedFingerprints)
}

func (r *sceneEditResolver) RemovedFingerprints(ctx context.Context, obj *models.SceneEdit) ([]*models.Fingerprint, error) {
	return r.fingerprintList(ctx, obj.RemovedFingerprints)
}
