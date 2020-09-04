package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type tagCategoryResolver struct{ *Resolver }

func (r *tagCategoryResolver) ID(ctx context.Context, obj *models.TagCategory) (string, error) {
	return obj.ID.String(), nil
}
func (r *tagCategoryResolver) Name(ctx context.Context, obj *models.TagCategory) (string, error) {
	return obj.Name, nil
}
func (r *tagCategoryResolver) Description(ctx context.Context, obj *models.TagCategory) (*string, error) {
	return resolveNullString(obj.Description), nil
}
func (r *tagCategoryResolver) Group(ctx context.Context, obj *models.TagCategory) (models.TagGroupEnum, error) {
	var ret models.TagGroupEnum
	if !resolveEnumString(obj.Group, &ret) {
		return "", nil
	}

	return ret, nil
}
