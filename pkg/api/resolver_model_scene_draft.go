package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

type sceneDraftResolver struct{ *Resolver }

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
			performer, err := qb.Find(*p.ID)
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
	for _, t := range obj.Tags {
		var st models.SceneDraftTag
		if t.ID != nil {
			tag, err := qb.Find(*t.ID)
			if err != nil {
				return nil, err
			}
			if tag != nil {
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
			studio, err := qb.Find(*obj.Studio.ID)
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

func (r *sceneDraftResolver) URL(ctx context.Context, obj *models.SceneDraft) (*models.URL, error) {
	if obj.URL == nil {
		return nil, nil
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Site()
	sites, _, err := qb.Query(nil)
	if err != nil {
		return nil, nil
	}
	var siteID *uuid.UUID
	for _, site := range sites {
		if site.Name == "Studio" && site.ValidTypes[0] == "SCENE" {
			siteID = &site.ID
		}
	}

	if siteID != nil {
		url := models.URL{
			URL:    *obj.URL,
			SiteID: *siteID,
		}
		return &url, nil
	}
	return nil, nil
}
