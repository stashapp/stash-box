package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindSite(ctx context.Context, id uuid.UUID) (*models.Site, error) {
	return r.services.Site().GetByID(ctx, id)
}

func (r *queryResolver) QuerySites(ctx context.Context) (*models.QuerySitesResultType, error) {
	sites, count, err := r.services.Site().Query(ctx)
	if err != nil {
		return nil, err
	}

	return &models.QuerySitesResultType{
		Sites: sites,
		Count: count,
	}, nil
}
