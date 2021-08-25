package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/manager/bulkimport"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) SubmitImport(ctx context.Context, input models.SubmitImportInput) (bool, error) {
	if err := validateRole(ctx, models.RoleEnumSubmitImport); err != nil {
		return false, err
	}

	fac := r.getRepoFactory(ctx)

	if err := fac.WithTxn(func() error {
		return bulkimport.SubmitImport(fac, getCurrentUser(ctx), input)
	}); err != nil {
		return false, err
	}

	return true, nil
}

func (r *mutationResolver) AbortImport(ctx context.Context) (bool, error) {
	fac := r.getRepoFactory(ctx)

	if err := fac.WithTxn(func() error {
		return bulkimport.AbortImport(fac, getCurrentUser(ctx))
	}); err != nil {
		return false, err
	}

	return true, nil
}

func (r *mutationResolver) CompleteSceneImport(ctx context.Context, input models.CompleteSceneImportInput) (bool, error) {
	if err := validateRole(ctx, models.RoleEnumSubmitImport); err != nil {
		return false, err
	}

	fac := r.getRepoFactory(ctx)

	if err := fac.WithTxn(func() error {
		return bulkimport.CompleteImport(fac, getCurrentUser(ctx), input)
	}); err != nil {
		return false, err
	}

	return true, nil
}

func (r *mutationResolver) MassageImportData(ctx context.Context, input models.MassageImportDataInput) (bool, error) {
	if err := validateRole(ctx, models.RoleEnumSubmitImport); err != nil {
		return false, err
	}

	fac := r.getRepoFactory(ctx)

	if err := fac.WithTxn(func() error {
		return bulkimport.MassageImportData(fac, getCurrentUser(ctx), input)
	}); err != nil {
		return false, err
	}

	return true, nil
}
