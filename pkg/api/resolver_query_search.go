package api

import (
	"context"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) SearchPerformer(ctx context.Context, term string, limit *int) ([]*models.Performer, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()

	trimmedQuery := strings.TrimSpace(strings.ToLower(term))
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

	if strings.HasPrefix(trimmedQuery, "https://") || strings.HasPrefix(trimmedQuery, "http://") {
		return qb.FindByURL(trimmedQuery, searchLimit)
	}

	return qb.SearchPerformers(term, searchLimit)
}

func (r *queryResolver) SearchScene(ctx context.Context, term string, limit *int) ([]*models.Scene, error) {
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

	if strings.HasPrefix(trimmedQuery, "https://") || strings.HasPrefix(trimmedQuery, "http://") {
		return qb.FindByURL(trimmedQuery, searchLimit)
	}

	return qb.SearchScenes(trimmedQuery, searchLimit)
}

func (r *queryResolver) SearchTag(ctx context.Context, term string, limit *int) ([]*models.Tag, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Tag()

	trimmedQuery := strings.TrimSpace(term)
	tagID, err := uuid.FromString(trimmedQuery)
	if err == nil {
		var tags []*models.Tag
		tag, err := qb.Find(tagID)
		if tag != nil {
			tags = append(tags, tag)
		}
		return tags, err
	}

	searchLimit := 10
	if limit != nil {
		searchLimit = *limit
	}

	return qb.SearchTags(trimmedQuery, searchLimit)
}

func (r *queryResolver) SearchStudio(ctx context.Context, term string, limit *int) ([]*models.Studio, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Studio()

	trimmedQuery := strings.TrimSpace(term)
	studioID, err := uuid.FromString(trimmedQuery)
	if err == nil {
		var studios []*models.Studio
		studio, err := qb.Find(studioID)
		if studio != nil {
			studios = append(studios, studio)
		}
		return studios, err
	}

	searchLimit := 10
	if limit != nil {
		searchLimit = *limit
	}

	return qb.SearchStudios(trimmedQuery, searchLimit)
}
