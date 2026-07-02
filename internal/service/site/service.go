package site

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
	"github.com/stashapp/stash-box/internal/storage"
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
	if err != nil {
		return nil, err
	}

	if err := applyFavicon(site.ID, input.Favicon); err != nil {
		return nil, err
	}

	return site, nil
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
	if err != nil {
		return nil, err
	}

	if err := applyFavicon(input.ID, input.Favicon); err != nil {
		return nil, err
	}

	return site, nil
}

// Destroy deletes a site by ID
func (s *Site) Destroy(ctx context.Context, id uuid.UUID) error {
	if err := s.queries.DeleteSite(ctx, id); err != nil {
		return err
	}
	return storage.ClearSiteIcon(id)
}

func (s *Site) FetchFavicons(ctx context.Context, url string) ([]models.SiteFavicon, error) {
	return storage.FetchSiteFavicons(ctx, url)
}

func applyFavicon(siteID uuid.UUID, favicon *string) error {
	if favicon == nil {
		return nil
	}
	if *favicon == "" {
		return storage.ClearSiteIcon(siteID)
	}
	return storage.SetSiteIcon(siteID, *favicon)
}

// Find finds a site by ID
func (s *Site) GetByID(ctx context.Context, id uuid.UUID) (*models.Site, error) {
	site, err := s.queries.GetSite(ctx, id)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.SiteToModelPtr(site), nil
}

// Categories

func (s *Site) CreateCategory(ctx context.Context, input models.SiteCategoryCreateInput) (*models.SiteCategory, error) {
	params := converter.SiteCategoryCreateInputToCreateParams(input)

	var category queries.SiteCategory
	err := s.withTxn(func(tx *queries.Queries) error {
		var err error
		category, err = tx.CreateSiteCategory(ctx, params)
		return err
	})

	return converter.SiteCategoryToModelPtr(category), err
}

func (s *Site) UpdateCategory(ctx context.Context, input models.SiteCategoryUpdateInput) (*models.SiteCategory, error) {
	var category queries.SiteCategory
	err := s.withTxn(func(tx *queries.Queries) error {
		existingCategory, err := tx.FindSiteCategory(ctx, input.ID)
		if err != nil {
			return err
		}

		updatedCategory := converter.UpdateSiteCategoryFromUpdateInput(existingCategory, input)
		category, err = tx.UpdateSiteCategory(ctx, updatedCategory)

		return err
	})

	return converter.SiteCategoryToModelPtr(category), err
}

func (s *Site) DeleteCategory(ctx context.Context, input models.SiteCategoryDestroyInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return tx.DeleteSiteCategory(ctx, input.ID)
	})
}

func (s *Site) FindCategory(ctx context.Context, id int) (*models.SiteCategory, error) {
	category, err := s.queries.FindSiteCategory(ctx, id)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.SiteCategoryToModelPtr(category), nil
}

func (s *Site) QueryCategories(ctx context.Context) (int, []models.SiteCategory, error) {
	categories, err := s.queries.GetAllSiteCategories(ctx)
	return len(categories), converter.SiteCategoriesToModels(categories), err
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

func (s *Site) LoadCategoriesByIds(ctx context.Context, ids []int) ([]*models.SiteCategory, []error) {
	categories, err := s.queries.GetSiteCategoriesByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	result := make([]*models.SiteCategory, len(ids))
	categoryMap := make(map[int]*models.SiteCategory)

	for _, category := range categories {
		categoryMap[category.ID] = converter.SiteCategoryToModelPtr(category)
	}

	for i, id := range ids {
		result[i] = categoryMap[id]
	}

	return result, make([]error, len(ids))
}
