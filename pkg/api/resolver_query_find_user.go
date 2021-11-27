package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func (r *queryResolver) FindUser(ctx context.Context, id *string, username *string) (*models.User, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.User()

	var ret *models.User
	var err error
	if id != nil {
		idUUID, _ := uuid.FromString(*id)
		ret, err = qb.Find(idUUID)
	} else if username != nil {
		ret, err = qb.FindByName(*username)
	}

	return ret, err
}

func (r *queryResolver) QueryUsers(ctx context.Context, userFilter *models.UserFilterType, filter *models.QuerySpec) (*models.QueryUsersResultType, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.User()

	users, count, err := qb.Query(userFilter, filter)
	return &models.QueryUsersResultType{
		Users: users,
		Count: count,
	}, err
}

func (r *queryResolver) Me(ctx context.Context) (*models.User, error) {
	currentUser := getCurrentUser(ctx)
	if currentUser == nil {
		return nil, user.ErrUnauthorized
	}

	return currentUser, nil
}
