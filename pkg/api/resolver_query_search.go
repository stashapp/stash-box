package api

import (
	"context"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) SearchPerformer(ctx context.Context, term string, limit *int) ([]*models.Performer, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()

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

	searchLimit := 5
	if limit != nil {
		searchLimit = *limit
	}

	return qb.SearchPerformers(term, searchLimit)
}

func (r *queryResolver) SearchScene(ctx context.Context, term string, limit *int) ([]*models.Scene, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Scene()

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

	searchLimit := 10
	if limit != nil {
		searchLimit = *limit
	}

	return qb.SearchScenes(trimmedQuery, searchLimit)
}
