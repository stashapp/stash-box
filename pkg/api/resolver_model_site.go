package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type siteResolver struct{ *Resolver }

func (r *siteResolver) Description(ctx context.Context, obj *models.Site) (*string, error) {
	return resolveNullString(obj.Description), nil
}

func (r *siteResolver) URL(ctx context.Context, obj *models.Site) (*string, error) {
	return resolveNullString(obj.URL), nil
}

func (r *siteResolver) Regex(ctx context.Context, obj *models.Site) (*string, error) {
	return resolveNullString(obj.Regex), nil
}

func (r *siteResolver) ValidTypes(ctx context.Context, obj *models.Site) ([]models.ValidSiteTypeEnum, error) {
	var ret []models.ValidSiteTypeEnum
	for _, validType := range obj.ValidTypes {
		var resolvedType models.ValidSiteTypeEnum
		if utils.ResolveEnumString(validType, &resolvedType) {
			ret = append(ret, resolvedType)
		}
	}

	return ret, nil
}

func (r *siteResolver) Created(ctx context.Context, obj *models.Site) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *siteResolver) Updated(ctx context.Context, obj *models.Site) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}

func (r *siteResolver) Icon(ctx context.Context, obj *models.Site) (string, error) {
	baseURL, _ := ctx.Value(BaseURLCtxKey).(string)
	return baseURL + "/images/site/" + obj.ID.String(), nil
}
