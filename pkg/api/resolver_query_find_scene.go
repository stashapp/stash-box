package api

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func (r *queryResolver) FindScene(ctx context.Context, id uuid.UUID) (*models.Scene, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()

	return qb.Find(id)
}

func (r *queryResolver) FindSceneByFingerprint(ctx context.Context, fingerprint models.FingerprintQueryInput) ([]*models.Scene, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()

	return qb.FindByFingerprint(fingerprint.Algorithm, fingerprint.Hash)
}

func (r *queryResolver) FindScenesByFingerprints(ctx context.Context, fingerprints []string) ([]*models.Scene, error) {
	if len(fingerprints) > 100 {
		return nil, errors.New("Too many fingerprints")
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()

	return qb.FindByFingerprints(fingerprints)
}

func (r *queryResolver) FindScenesByFullFingerprints(ctx context.Context, fingerprints []*models.FingerprintQueryInput) ([]*models.Scene, error) {
	if len(fingerprints) > 100 {
		return nil, errors.New("Too many fingerprints")
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()

	if config.GetPHashDistance() == 0 {
		var hashes []string
		for _, fp := range fingerprints {
			hashes = append(hashes, fp.Hash)
		}
		return qb.FindByFingerprints(hashes)
	}

	return qb.FindByFullFingerprints(fingerprints)
}

func (r *queryResolver) QueryScenes(ctx context.Context, input models.SceneQueryInput) (*models.SceneQuery, error) {
	return &models.SceneQuery{
		Filter: input,
	}, nil
}

func (r *queryResolver) FindScenesBySceneFingerprints(ctx context.Context, sceneFingerprints [][]*models.FingerprintQueryInput) ([][]*models.Scene, error) {
	if len(sceneFingerprints) > 40 {
		return nil, errors.New("Too many scenes")
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()

	var fingerprints []*models.FingerprintQueryInput
	for _, scene := range sceneFingerprints {
		fingerprints = append(fingerprints, scene...)
	}

	// Find ids for all scenes matching a fingerprint
	sceneIds, err := qb.FindIdsBySceneFingerprints(fingerprints)
	if err != nil {
		return nil, err
	}

	var ids []uuid.UUID
	for _, id := range sceneIds {
		ids = append(ids, id...)
	}

	// Fetch all scene ids
	scenes, err := qb.FindByIds(ids)
	if err != nil {
		return nil, err
	}
	sceneMap := make(map[uuid.UUID]*models.Scene)
	for _, scene := range scenes {
		sceneMap[scene.ID] = scene
	}

	// Deduplicate list of scenes for each group of fingerprints
	var result = make([][]*models.Scene, len(sceneFingerprints))
	for i, scene := range sceneFingerprints {
		sceneIDMap := make(map[uuid.UUID]bool)
		for _, fp := range scene {
			for _, id := range sceneIds[fp.Hash] {
				sceneIDMap[id] = true
			}
		}

		var fpScenes []*models.Scene
		for id := range sceneIDMap {
			fpScenes = append(fpScenes, sceneMap[id])
		}

		result[i] = fpScenes
	}

	return result, nil
}

type querySceneResolver struct{ *Resolver }

func (r *querySceneResolver) Count(ctx context.Context, obj *models.SceneQuery) (int, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()
	u := user.GetCurrentUser(ctx)
	return qb.QueryCount(obj.Filter, u.ID)
}

func (r *querySceneResolver) Scenes(ctx context.Context, obj *models.SceneQuery) ([]*models.Scene, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()
	u := user.GetCurrentUser(ctx)
	return qb.QueryScenes(obj.Filter, u.ID)
}

func (r *queryResolver) QueryExistingScene(ctx context.Context, input models.QueryExistingSceneInput) (*models.QueryExistingSceneResult, error) {
	return &models.QueryExistingSceneResult{
		Input: input,
	}, nil
}

type queryExistingSceneResolver struct{ *Resolver }

func (r *queryExistingSceneResolver) Edits(ctx context.Context, obj *models.QueryExistingSceneResult) ([]*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()
	return qb.FindPendingSceneCreation(obj.Input)
}

func (r *queryExistingSceneResolver) Scenes(ctx context.Context, obj *models.QueryExistingSceneResult) ([]*models.Scene, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()
	return qb.FindExistingScenes(obj.Input)
}
