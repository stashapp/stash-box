package api

import (
	"context"
	"errors"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindScene(ctx context.Context, id string) (*models.Scene, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewSceneQueryBuilder(nil)

	idUUID, _ := uuid.FromString(id)
	return qb.Find(idUUID)
}

func (r *queryResolver) FindSceneByFingerprint(ctx context.Context, fingerprint models.FingerprintQueryInput) ([]*models.Scene, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewSceneQueryBuilder(nil)

	return qb.FindByFingerprint(fingerprint.Algorithm, fingerprint.Hash)
}

func (r *queryResolver) FindScenesByFingerprints(ctx context.Context, fingerprints []string) ([]*models.Scene, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	if len(fingerprints) > 100 {
		return nil, errors.New("Too many fingerprints.")
	}

	qb := models.NewSceneQueryBuilder(nil)

	return qb.FindByFingerprints(fingerprints)
}

func (r *queryResolver) QueryScenes(ctx context.Context, sceneFilter *models.SceneFilterType, filter *models.QuerySpec) (*models.QueryScenesResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewSceneQueryBuilder(nil)

	scenes, count := qb.Query(sceneFilter, filter)
	return &models.QueryScenesResultType{
		Scenes: scenes,
		Count:  count,
	}, nil
}
