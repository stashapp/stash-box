package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type sceneEditResolver struct{ *Resolver }

func (r *sceneEditResolver) performerAppearanceList(ctx context.Context, performers []*models.PerformerAppearanceInput) ([]*models.PerformerAppearance, error) {
	if len(performers) == 0 {
		return nil, nil
	}

	var uuids []uuid.UUID
	for _, p := range performers {
		performerID, _ := uuid.FromString(p.PerformerID)
		uuids = append(uuids, performerID)
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

func (r *sceneEditResolver) tagList(ctx context.Context, tagIDs []string) ([]*models.Tag, error) {
	if len(tagIDs) == 0 {
		return nil, nil
	}

	var uuids []uuid.UUID
	for _, id := range tagIDs {
		tagID, _ := uuid.FromString(id)
		uuids = append(uuids, tagID)
	}
	tags, errors := dataloader.For(ctx).TagByID.LoadAll(uuids)
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

func (r *sceneEditResolver) fingerprintList(ctx context.Context, performers []*models.FingerprintEditInput) ([]*models.Fingerprint, error) {
	var ret []*models.Fingerprint
	for _, p := range performers {
		rr := &models.Fingerprint{
			Hash:        p.Hash,
			Algorithm:   p.Algorithm,
			Duration:    p.Duration,
			Submissions: p.Submissions,
			Created:     p.Created,
			Updated:     p.Updated,
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

func (r *sceneEditResolver) AddedImages(ctx context.Context, obj *models.SceneEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.AddedImages)
}

func (r *sceneEditResolver) RemovedImages(ctx context.Context, obj *models.SceneEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.RemovedImages)
}
