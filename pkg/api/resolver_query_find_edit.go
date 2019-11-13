package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *queryResolver) FindEdit(ctx context.Context, id *string) (*models.Edit, error) {
	panic("not implemented")
}
func (r *queryResolver) QueryEdits(ctx context.Context, editFilter *models.EditFilterType, filter *models.QuerySpec) (*models.QueryEditsResultType, error) {
	panic("not implemented")
}
