package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) SiteCreate(ctx context.Context, input models.SiteCreateInput) (*models.Site, error) {
	var err error

	if err != nil {
		return nil, err
	}

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new site from the input
	currentTime := time.Now()
	newSite := models.Site{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newSite.CopyFromCreateInput(input)

	// Start the transaction and save the site
	fac := r.getRepoFactory(ctx)
	var site *models.Site
	err = fac.WithTxn(func() error {
		qb := fac.Site()
		site, err = qb.Create(newSite)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return site, nil
}

func (r *mutationResolver) SiteUpdate(ctx context.Context, input models.SiteUpdateInput) (*models.Site, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	var site *models.Site
	err := fac.WithTxn(func() error {
		qb := fac.Site()

		// get the existing site and modify it
		updatedSite, err := qb.Find(input.ID)
		if err != nil {
			return err
		}

		updatedSite.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

		// Populate site from the input
		updatedSite.CopyFromUpdateInput(input)

		site, err = qb.Update(*updatedSite)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return site, nil
}

func (r *mutationResolver) SiteDestroy(ctx context.Context, input models.SiteDestroyInput) (bool, error) {
	if err := validateAdmin(ctx); err != nil {
		return false, err
	}

	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.Site()
		return qb.Destroy(input.ID)
	})

	if err != nil {
		return false, err
	}
	return true, nil
}
