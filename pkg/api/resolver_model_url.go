package api

import (
	"context"
	"strings"

	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type urlResolver struct{ *Resolver }

func (r *urlResolver) URL(ctx context.Context, obj *models.URL) (string, error) {
	return obj.URL, nil
}

func (r *urlResolver) Site(ctx context.Context, obj *models.URL) (*models.Site, error) {
	return dataloader.For(ctx).SiteByID.Load(obj.SiteID)
}

func (r *urlResolver) Type(ctx context.Context, obj *models.URL) (string, error) {
	site, err := dataloader.For(ctx).SiteByID.Load(obj.SiteID)
	if err != nil {
		return "", err
	}
	return strings.ToUpper(site.Name), err
}

func urlList(ctx context.Context, urls []*models.URL) ([]*models.URL, error) {
	if len(urls) == 0 {
		return nil, nil
	}

	return urls, nil
}
