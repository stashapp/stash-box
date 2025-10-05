package api

import (
	"context"
	"errors"
	"strings"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindScene(ctx context.Context, id uuid.UUID) (*models.Scene, error) {
	return r.services.Scene().FindByID(ctx, id)
}

func (r *queryResolver) FindSceneByFingerprint(ctx context.Context, fingerprint models.FingerprintQueryInput) ([]models.Scene, error) {
	return r.services.Scene().FindByFingerprint(ctx, fingerprint.Algorithm, fingerprint.Hash)
}

func (r *queryResolver) FindScenesByFingerprints(ctx context.Context, fingerprints []string) ([]models.Scene, error) {
	if len(fingerprints) > 100 {
		return nil, errors.New("too many fingerprints")
	}

	return r.services.Scene().FindByFingerprints(ctx, fingerprints)
}

func (r *queryResolver) FindScenesByFullFingerprints(ctx context.Context, fingerprints []models.FingerprintQueryInput) ([]models.Scene, error) {
	if len(fingerprints) > 100 {
		return nil, errors.New("too many fingerprints")
	}

	if config.GetPHashDistance() == 0 {
		var hashes []string
		for _, fp := range fingerprints {
			hashes = append(hashes, fp.Hash)
		}
		return r.services.Scene().FindByFingerprints(ctx, hashes)
	}

	return r.services.Scene().FindByFullFingerprints(ctx, fingerprints)
}

func (r *queryResolver) QueryScenes(ctx context.Context, input models.SceneQueryInput) (*models.SceneQuery, error) {
	return &models.SceneQuery{
		Filter: input,
	}, nil
}

func (r *queryResolver) FindScenesBySceneFingerprints(ctx context.Context, sceneFingerprints [][]models.FingerprintQueryInput) ([][]*models.Scene, error) {
	if len(sceneFingerprints) > 40 {
		return nil, errors.New("too many scenes")
	}

	return r.services.Scene().FindScenesBySceneFingerprints(ctx, sceneFingerprints)
}

type querySceneResolver struct{ *Resolver }

func (r *querySceneResolver) Count(ctx context.Context, obj *models.SceneQuery) (int, error) {
	return r.services.Scene().QueryCount(ctx, obj.Filter)
}

func (r *querySceneResolver) Scenes(ctx context.Context, obj *models.SceneQuery) ([]models.Scene, error) {
	return r.services.Scene().Query(ctx, obj.Filter)
}

func (r *queryResolver) QueryExistingScene(ctx context.Context, input models.QueryExistingSceneInput) (*models.QueryExistingSceneResult, error) {
	return &models.QueryExistingSceneResult{
		Input: input,
	}, nil
}

type queryExistingSceneResolver struct{ *Resolver }

func (r *queryExistingSceneResolver) Edits(ctx context.Context, obj *models.QueryExistingSceneResult) ([]models.Edit, error) {
	return r.services.Edit().FindPendingSceneCreation(ctx, obj.Input)
}

func (r *queryExistingSceneResolver) Scenes(ctx context.Context, obj *models.QueryExistingSceneResult) ([]models.Scene, error) {
	return r.services.Scene().FindExistingScenes(ctx, obj.Input)
}

func (r *queryResolver) SearchScene(ctx context.Context, term string, limit *int) ([]models.Scene, error) {
	trimmedQuery := strings.TrimSpace(term)
	sceneID, err := uuid.FromString(trimmedQuery)
	if err == nil {
		var scenes []models.Scene
		scene, err := r.services.Scene().FindByID(ctx, sceneID)
		if scene != nil {
			scenes = append(scenes, *scene)
		}
		return scenes, err
	}

	searchLimit := 10
	if limit != nil {
		searchLimit = *limit
	}

	if strings.HasPrefix(trimmedQuery, "https://") || strings.HasPrefix(trimmedQuery, "http://") {
		return r.services.Scene().FindByURL(ctx, trimmedQuery, searchLimit)
	}

	return r.services.Scene().SearchScenes(ctx, trimmedQuery, searchLimit)
}
