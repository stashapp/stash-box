package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/manager/bulkimport"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) QueryImportScenes(ctx context.Context, querySpec *models.QuerySpec) (*models.QueryImportScenesResult, error) {
	if err := validateRole(ctx, models.RoleEnumSubmitImport); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)

	var ret *models.QueryImportScenesResult
	if err := fac.WithTxn(func() error {
		var err error
		ret, err = bulkimport.QueryImportSceneData(fac.ImportRow(), getCurrentUser(ctx), querySpec)
		return err
	}); err != nil {
		return nil, err
	}

	return ret, nil
}

func (r *queryResolver) QueryImportSceneMappings(ctx context.Context) (*models.SceneImportMappings, error) {
	if err := validateRole(ctx, models.RoleEnumSubmitImport); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)

	var ret *models.SceneImportMappings
	if err := fac.WithTxn(func() error {
		var err error
		ret, err = bulkimport.GetSceneImportMappings(fac, getCurrentUser(ctx))
		return err
	}); err != nil {
		return nil, err
	}

	return ret, nil
}
