package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
)

type sceneDraftResolver struct{ *Resolver }

func (r *sceneDraftResolver) ID(ctx context.Context, obj *models.SceneDraft) (*string, error) {
	if obj.ID != nil {
		val := obj.ID.String()
		return &val, nil
	}
	return nil, nil
}

func (r *sceneDraftResolver) Image(ctx context.Context, obj *models.SceneDraft) (*models.Image, error) {
	if obj.Image == nil {
		return nil, nil
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Image()
	return qb.Find(*obj.Image)
}

func (r *sceneDraftResolver) Performers(ctx context.Context, obj *models.SceneDraft) ([]models.SceneDraftPerformer, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()

	var performers []models.SceneDraftPerformer
	for _, p := range obj.Performers {
		var sp models.SceneDraftPerformer
		if p.ID != nil {
			performer, err := qb.FindWithRedirect(*p.ID)
			if err != nil {
				return nil, err
			}
			if performer != nil {
				sp = *performer
			}
		}
		if sp == nil {
			sp = p
		}
		performers = append(performers, sp)
	}

	return performers, nil
}

func (r *sceneDraftResolver) Tags(ctx context.Context, obj *models.SceneDraft) ([]models.SceneDraftTag, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Tag()

	var tags []models.SceneDraftTag
	tagMap := make(map[string]bool)
	for _, t := range obj.Tags {
		var st models.SceneDraftTag
		if t.ID != nil {
			tag, err := qb.Find(*t.ID)
			if err != nil {
				return nil, err
			}
			if tag != nil {
				if _, exists := tagMap[tag.Name]; exists {
					// Resolved tag already exists, so we skip.
					// This can happen with merged tags that redirect to the same thing.
					continue
				}
				tagMap[tag.Name] = true
				st = *tag
			}
		}
		if st == nil {
			st = t
		}
		tags = append(tags, st)
	}

	return tags, nil
}

func (r *sceneDraftResolver) Studio(ctx context.Context, obj *models.SceneDraft) (models.SceneDraftStudio, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Studio()

	if obj.Studio != nil {
		var ret models.SceneDraftStudio
		if obj.Studio.ID != nil {
			studio, err := qb.FindWithRedirect(*obj.Studio.ID)
			if err != nil {
				return nil, err
			}
			if studio != nil {
				ret = studio
			}
		}
		if ret == nil {
			ret = obj.Studio
		}
		return ret, nil
	}
	return nil, nil
}
