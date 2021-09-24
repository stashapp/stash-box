package api

import (
	"context"
	"sort"

	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
)

type tagResolver struct{ *Resolver }

func (r *tagResolver) ID(_ context.Context, obj *models.Tag) (string, error) {
	return obj.ID.String(), nil
}
func (r *tagResolver) Description(_ context.Context, obj *models.Tag) (*string, error) {
	return resolveNullString(obj.Description), nil
}
func (r *tagResolver) Aliases(ctx context.Context, obj *models.Tag) ([]string, error) {
	qb := r.getRepoFactory(ctx).Tag()
	aliases, err := qb.GetAliases(obj.ID)

	if err != nil {
		return nil, err
	}

	sort.Strings(aliases)

	return aliases, nil
}

func (r *tagResolver) Edits(ctx context.Context, obj *models.Tag) ([]*models.Edit, error) {
	eqb := r.getRepoFactory(ctx).Edit()
	return eqb.FindByTagID(obj.ID)
}

func (r *tagResolver) Category(ctx context.Context, obj *models.Tag) (*models.TagCategory, error) {
	if obj.CategoryID.Valid {
		return dataloader.For(ctx).TagCategoryByID.Load(obj.CategoryID.UUID)
	}
	return nil, nil
}
