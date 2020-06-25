package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type studioResolver struct{ *Resolver }

func (r *studioResolver) ID(ctx context.Context, obj *models.Studio) (string, error) {
	return obj.ID.String(), nil
}

func (r *studioResolver) Urls(ctx context.Context, obj *models.Studio) ([]*models.URL, error) {
	qb := models.NewStudioQueryBuilder(nil)
	urls, err := qb.GetUrls(obj.ID)

	if err != nil {
		return nil, err
	}

	var ret []*models.URL
	for _, url := range urls {
		retURL := url.ToURL()
		ret = append(ret, &retURL)
	}

	return ret, nil
}

func (r *studioResolver) Parent(ctx context.Context, obj *models.Studio) (*models.Studio, error) {
	if !obj.ParentStudioID.Valid {
		return nil, nil
	}

	qb := models.NewStudioQueryBuilder(nil)
	parent, err := qb.Find(obj.ParentStudioID.UUID)

	if err != nil {
		return nil, err
	}

	return parent, nil
}

func (r *studioResolver) ChildStudios(ctx context.Context, obj *models.Studio) ([]*models.Studio, error) {
	qb := models.NewStudioQueryBuilder(nil)
	children, err := qb.FindByParentID(obj.ID)

	if err != nil {
		return nil, err
	}

	return children, nil
}
func (r *studioResolver) Images(ctx context.Context, obj *models.Studio) ([]*models.Image, error) {
	qb := models.NewImageQueryBuilder(nil)
	return qb.FindByStudioID(obj.ID)
}
