package api

import (
	"context"
	"regexp"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
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
			tag, err := qb.FindWithRedirect(*t.ID)
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

func (r *sceneDraftResolver) URL(ctx context.Context, obj *models.SceneDraft) (*models.URL, error) {
	if obj.URL == nil {
		return nil, nil
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Site()
	sites, _, err := qb.Query()
	if err != nil {
		return nil, nil
	}
	var studioSiteID *uuid.UUID
	var siteID *uuid.UUID
	for _, site := range sites {
		// Skip any sites not valid for scenes
		if !utils.Includes(site.ValidTypes, models.ValidSiteTypeEnumScene.String()) {
			continue
		}

		if site.Name == "Studio" {
			studioSiteID = &site.ID
			continue
		}

		if site.Regex.Valid {
			re, err := regexp.Compile(site.Regex.String)
			if err == nil && re.MatchString(*obj.URL) {
				siteID = &site.ID
				break
			}
		}
	}

	if siteID == nil && studioSiteID != nil {
		siteID = studioSiteID
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
