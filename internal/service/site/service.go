package site

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
)

// Site handles site-related operations
type Site struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

// NewSite creates a new site service
func NewSite(queries *queries.Queries, withTxn queries.WithTxnFunc) *Site {
	return &Site{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Site) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

// Create creates a new site
func (s *Site) Create(ctx context.Context, input models.SiteCreateInput) (*models.Site, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	newSite := converter.SiteCreateInputToSite(input)
	newSite.ID = id

	var site *models.Site
	err = s.withTxn(func(tx *queries.Queries) error {
		dbSite, err := tx.CreateSite(ctx, converter.SiteToCreateParams(newSite))
		site = converter.SiteToModelPtr(dbSite)

		return err
	})

	return site, err

}

// Update updates an existing site
func (s *Site) Update(ctx context.Context, input models.SiteUpdateInput) (*models.Site, error) {
	var site *models.Site
	err := s.withTxn(func(tx *queries.Queries) error {
		dbSite, err := tx.GetSite(ctx, input.ID)
		if err != nil {
			return err
		}
		updatedSite := converter.SiteToModel(dbSite)
		converter.UpdateSiteFromUpdateInput(&updatedSite, input)

		dbSite, err = tx.UpdateSite(ctx, converter.SiteToUpdateParams(updatedSite))
		site = converter.SiteToModelPtr(dbSite)

		return err
	})

	return site, err
}

// Destroy deletes a site by ID
func (s *Site) Destroy(ctx context.Context, id uuid.UUID) error {
	return s.queries.DeleteSite(ctx, id)
}

// Find finds a site by ID
func (s *Site) GetByID(ctx context.Context, id uuid.UUID) (*models.Site, error) {
	site, err := s.queries.GetSite(ctx, id)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.SiteToModelPtr(site), nil
}

// Dataloader methods

func (s *Site) LoadIds(ctx context.Context, ids []uuid.UUID) ([]*models.Site, []error) {
	sites, err := s.queries.FindSitesByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	result := make([]*models.Site, len(ids))
	siteMap := make(map[uuid.UUID]*models.Site)

	for _, site := range sites {
		siteMap[site.ID] = converter.SiteToModelPtr(site)
	}

	for i, id := range ids {
		result[i] = siteMap[id]
	}

	return result, make([]error, len(ids))
}
