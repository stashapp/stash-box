package api

import (
	"context"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) SearchPerformer(ctx context.Context, term string) ([]*models.Performer, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewPerformerQueryBuilder(nil)

	trimmedQuery := strings.TrimSpace(term)
	performerID, err := uuid.FromString(trimmedQuery)
	if err == nil {
		var performers []*models.Performer
		performer, err := qb.Find(performerID)
		if performer != nil {
			performers = append(performers, performer)
		}
		return performers, err
	}

	return qb.SearchPerformers(term)
}

func (r *queryResolver) SearchScene(ctx context.Context, term string) ([]*models.Scene, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	qb := models.NewSceneQueryBuilder(nil)

	trimmedQuery := strings.TrimSpace(term)
	sceneID, err := uuid.FromString(trimmedQuery)
	if err == nil {
		var scenes []*models.Scene
		scene, err := qb.Find(sceneID)
		if scene != nil {
			scenes = append(scenes, scene)
		}
		return scenes, err
	}

	return qb.SearchScenes(trimmedQuery)
}
