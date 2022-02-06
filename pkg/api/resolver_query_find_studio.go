package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func (r *queryResolver) FindStudio(ctx context.Context, id *uuid.UUID, name *string) (*models.Studio, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Studio()

	if id != nil {
		return qb.Find(*id)
	} else if name != nil {
		return qb.FindByName(*name)
	}

	return nil, nil
}

func (r *queryResolver) QueryStudios(ctx context.Context, input models.StudioQueryInput) (*models.QueryStudiosResultType, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Studio()
	user := user.GetCurrentUser(ctx)

	studios, count, err := qb.Query(input, user.ID)
	return &models.QueryStudiosResultType{
		Studios: studios,
		Count:   count,
	}, err
}
