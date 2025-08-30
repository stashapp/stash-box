package site

import (
	"context"
	"errors"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

// Site handles site-related operations
type Site struct {
	queries *db.Queries
	withTxn db.WithTxnFunc
}

// NewSite creates a new site service
func NewSite(queries *db.Queries, withTxn db.WithTxnFunc) *Site {
	return &Site{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Site) WithTxn(fn func(*db.Queries) error) error {
	return s.withTxn(fn)
}

// Create creates a new site
func (s *Site) Create(ctx context.Context, input models.SiteCreateInput) (*models.Site, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	currentTime := time.Now()
	newSite := converter.SiteCreateInputToSite(input)
	newSite.ID = id
	newSite.CreatedAt = currentTime
	newSite.UpdatedAt = currentTime

	var site *models.Site
	err = s.withTxn(func(tx *db.Queries) error {
		dbSite, err := tx.CreateSite(ctx, converter.SiteToCreateParams(newSite))
		site = converter.SiteToModel(dbSite)

		return err
	})

	return site, err

}

// Update updates an existing site
func (s *Site) Update(ctx context.Context, input models.SiteUpdateInput) (*models.Site, error) {
	var site *models.Site
	err := s.withTxn(func(tx *db.Queries) error {
		dbSite, err := tx.GetSite(ctx, input.ID)
		if err != nil {
			return err
		}
		updatedSite := converter.SiteToModel(dbSite)
		updatedSite.UpdatedAt = time.Now()
		converter.UpdateSiteFromUpdateInput(updatedSite, input)

		dbSite, err = tx.UpdateSite(ctx, converter.SiteToUpdateParams(*updatedSite))
		site = converter.SiteToModel(dbSite)

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
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return converter.SiteToModel(site), nil
}

// Dataloader methods

func (s *Site) FindByIds(ctx context.Context, ids []uuid.UUID) ([]*models.Site, []error) {
	sites, err := s.queries.FindSitesByIds(ctx, ids)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	result := make([]*models.Site, len(ids))
	siteMap := make(map[uuid.UUID]*models.Site)

	for _, site := range sites {
		siteMap[site.ID] = converter.SiteToModel(site)
	}

	for i, id := range ids {
		result[i] = siteMap[id]
	}

	return result, make([]error, len(ids))
}
