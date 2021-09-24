package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type tagCategoryResolver struct{ *Resolver }

func (r *tagCategoryResolver) ID(_ context.Context, obj *models.TagCategory) (string, error) {
	return obj.ID.String(), nil
}
func (r *tagCategoryResolver) Name(_ context.Context, obj *models.TagCategory) (string, error) {
	return obj.Name, nil
}
func (r *tagCategoryResolver) Description(_ context.Context, obj *models.TagCategory) (*string, error) {
	return resolveNullString(obj.Description), nil
}
func (r *tagCategoryResolver) Group(_ context.Context, obj *models.TagCategory) (models.TagGroupEnum, error) {
	var ret models.TagGroupEnum
	if !utils.ResolveEnumString(obj.Group, &ret) {
		return "", nil
	}

	return ret, nil
}
