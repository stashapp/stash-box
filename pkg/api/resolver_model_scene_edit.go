package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
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

func (r *sceneEditResolver) Fingerprints(ctx context.Context, obj *models.SceneEdit) ([]*models.Fingerprint, error) {
	var ret []*models.Fingerprint
	for _, fp := range obj.AddedFingerprints {
		ret = append(ret, &models.Fingerprint{
			Hash:          fp.Hash,
			Algorithm:     fp.Algorithm,
			Duration:      fp.Duration,
			Submissions:   0,
			Created:       time.Now(),
			Updated:       time.Now(),
			UserSubmitted: true,
		})
	}

	return ret, nil
}

func (r *sceneEditResolver) Images(ctx context.Context, obj *models.SceneEdit) ([]*models.Image, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Image()
	sceneID, err := fac.Edit().FindSceneID(obj.EditID)
	if err != nil {
		return nil, err
	}

	currentImages, err := qb.FindBySceneID(*sceneID)
	if err != nil {
		return nil, err
	}
	var imageIds []uuid.UUID
	for _, image := range currentImages {
		imageIds = append(imageIds, image.ID)
	}
	utils.ProcessSlice(imageIds, obj.AddedImages, obj.RemovedImages)

	images, errs := qb.FindByIds(imageIds)
	return images, errs[0]
}

func (r *sceneEditResolver) Tags(ctx context.Context, obj *models.SceneEdit) ([]*models.Tag, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Tag()
	sceneID, err := fac.Edit().FindSceneID(obj.EditID)
	if err != nil {
		return nil, err
	}

	currentTags, err := qb.FindBySceneID(*sceneID)
	if err != nil {
		return nil, err
	}
	var tagIds []uuid.UUID
	for _, tag := range currentTags {
		tagIds = append(tagIds, tag.ID)
	}
	utils.ProcessSlice(tagIds, obj.AddedTags, obj.RemovedTags)

	tags, errs := qb.FindByIds(tagIds)
	return tags, errs[0]
}

func (r *sceneEditResolver) Performers(ctx context.Context, obj *models.SceneEdit) ([]*models.PerformerAppearance, error) {
	fac := r.getRepoFactory(ctx)
	pqb := fac.Performer()

	// Pointers aren't compared by value, so we have to use a temporary struct
	type appearance struct {
		ID uuid.UUID
		As string
	}

	sceneID, err := fac.Edit().FindSceneID(obj.EditID)
	if err != nil {
		return nil, err
	}

	currentPerformers, err := fac.Scene().GetPerformers(*sceneID)
	if err != nil {
		return nil, err
	}
	var appearances []appearance
	for _, a := range currentPerformers {
		appearances = append(appearances, appearance{
			As: a.As.String,
			ID: a.PerformerID,
		})
	}
	var added []appearance
	for _, a := range obj.AddedPerformers {
		as := ""
		if a.As != nil {
			as = *a.As
		}
		appearances = append(appearances, appearance{
			As: as,
			ID: a.PerformerID,
		})
	}
	var removed []appearance
	for _, a := range obj.RemovedPerformers {
		as := ""
		if a.As != nil {
			as = *a.As
		}
		appearances = append(appearances, appearance{
			As: as,
			ID: a.PerformerID,
		})
	}

	utils.ProcessSlice(appearances, added, removed)

	var performerAppearances []*models.PerformerAppearance
	for _, v := range appearances {
		performer, err := pqb.Find(v.ID)
		if err != nil {
			return nil, err
		}
		alias := &v.As
		if v.As == "" {
			alias = nil
		}
		performerAppearances = append(performerAppearances, &models.PerformerAppearance{
			Performer: performer,
			As:        alias,
		})
	}

	return performerAppearances, nil
}

func (r *sceneEditResolver) Urls(ctx context.Context, obj *models.SceneEdit) ([]*models.URL, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()
	sceneID, err := fac.Edit().FindSceneID(obj.EditID)
	if err != nil {
		return nil, err
	}

	currentURLs, err := qb.GetURLs(*sceneID)
	if err != nil {
		return nil, err
	}

	var urls []models.URL
	for _, v := range currentURLs {
		urls = append(urls, *v)
	}
	var added []models.URL
	for _, v := range obj.AddedUrls {
		added = append(added, *v)
	}
	var removed []models.URL
	for _, v := range obj.RemovedUrls {
		removed = append(removed, *v)
	}

	utils.ProcessSlice(urls, added, removed)

	var ret []*models.URL
	for _, v := range urls {
		ret = append(ret, &v)
	}

	return ret, nil
}
