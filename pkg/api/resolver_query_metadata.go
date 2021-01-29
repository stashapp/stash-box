package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/manager"
)

func (r *queryResolver) MetadataImport(ctx context.Context) (string, error) {
	manager.GetInstance().Import()
	return "todo", nil
}

func (r *queryResolver) MetadataExport(ctx context.Context) (string, error) {
	manager.GetInstance().Export()
	return "todo", nil
}
