package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindSite(ctx context.Context, id uuid.UUID) (*models.Site, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Site()

	return qb.Find(id)
}

func (r *queryResolver) QuerySites(ctx context.Context) (*models.QuerySitesResultType, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Site()

	sites, count, err := qb.Query()
	if err != nil {
		return nil, err
	}

	return &models.QuerySitesResultType{
		Sites: sites,
		Count: count,
	}, nil
}
