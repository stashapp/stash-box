package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type tagResolver struct{ *Resolver }

func (r *tagResolver) ID(ctx context.Context, obj *models.Tag) (string, error) {
	return obj.ID.String(), nil
}
func (r *tagResolver) Description(ctx context.Context, obj *models.Tag) (*string, error) {
	return resolveNullString(obj.Description), nil
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

func (r *tagResolver) Category(ctx context.Context, obj *models.Tag) (*models.TagCategory, error) {
	if obj.CategoryID.Valid {
		return dataloader.For(ctx).TagCategoryById.Load(obj.CategoryID.UUID)
	} else {
		return nil, nil
	}
}
