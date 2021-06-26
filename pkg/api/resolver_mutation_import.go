package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/manager/bulkimport"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) AnalyzeData(ctx context.Context, input models.BulkImportInput) (*models.BulkAnalyzeResult, error) {
	return bulkimport.Analyze(r.getRepoFactory(ctx), input)
}

func (r *mutationResolver) ImportData(ctx context.Context, input models.BulkImportInput) (*models.BulkImportResult, error) {
	data, err := bulkimport.Analyze(r.getRepoFactory(ctx), input)
	if err != nil {
		return nil, err
	}

	return bulkimport.ApplyImport(r.getRepoFactory(ctx), data)
}
