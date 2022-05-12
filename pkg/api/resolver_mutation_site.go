package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) SiteCreate(ctx context.Context, input models.SiteCreateInput) (*models.Site, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	currentTime := time.Now()
	newSite := models.Site{
		ID:        UUID,
		CreatedAt: currentTime,
		UpdatedAt: currentTime,
	}
	newSite.CopyFromCreateInput(input)

	fac := r.getRepoFactory(ctx)
	var site *models.Site
	err = fac.WithTxn(func() error {
		qb := fac.Site()
		site, err = qb.Create(newSite)

		return err
	})

	return site, err
}

func (r *mutationResolver) SiteUpdate(ctx context.Context, input models.SiteUpdateInput) (*models.Site, error) {
	fac := r.getRepoFactory(ctx)
	var site *models.Site
	err := fac.WithTxn(func() error {
		qb := fac.Site()

		updatedSite, err := qb.Find(input.ID)
		if err != nil {
			return err
		}

		updatedSite.UpdatedAt = time.Now()
		updatedSite.CopyFromUpdateInput(input)

		site, err = qb.Update(*updatedSite)

		return err
	})

	return site, err
}

func (r *mutationResolver) SiteDestroy(ctx context.Context, input models.SiteDestroyInput) (bool, error) {
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.Site()
		return qb.Destroy(input.ID)
	})

	return err == nil, err
}
