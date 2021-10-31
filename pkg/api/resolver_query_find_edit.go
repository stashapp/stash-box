package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindEdit(ctx context.Context, id *string) (*models.Edit, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()

	idUUID, _ := uuid.FromString(*id)
	return qb.Find(idUUID)
}
func (r *queryResolver) QueryEdits(ctx context.Context, editFilter *models.EditFilterType, filter *models.QuerySpec) (*models.QueryEditsResultType, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()

	edits, count, err := qb.Query(editFilter, filter)
	return &models.QueryEditsResultType{
		Edits: edits,
		Count: count,
	}, err
}
