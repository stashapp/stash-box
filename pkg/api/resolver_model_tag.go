package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type tagResolver struct{ *Resolver }

func (r *tagResolver) ID(ctx context.Context, obj *models.Tag) (string, error) {
	return obj.ID.String(), nil
}
func (r *tagResolver) Description(ctx context.Context, obj *models.Tag) (*string, error) {
	return resolveNullString(obj.Description)
}
func (r *tagResolver) Aliases(ctx context.Context, obj *models.Tag) ([]string, error) {
	qb := models.NewTagQueryBuilder(nil)
	aliases, err := qb.GetAliases(obj.ID)

	if err != nil {
		return nil, err
	}

	return aliases, nil
}

func (r *tagResolver) Edits(ctx context.Context, obj *models.Tag) ([]*models.Edit, error) {
	eqb := models.NewEditQueryBuilder(nil)
	return eqb.FindByTagID(obj.ID)
}
