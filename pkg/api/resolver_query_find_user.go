package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func (r *queryResolver) FindUser(ctx context.Context, id *uuid.UUID, username *string) (*models.User, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.User()

	var ret *models.User
	var err error
	if id != nil {
		ret, err = qb.Find(*id)
	} else if username != nil {
		ret, err = qb.FindByName(*username)
	}

	return ret, err
}

func (r *queryResolver) QueryUsers(ctx context.Context, input models.UserQueryInput) (*models.QueryUsersResultType, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.User()

	users, count, err := qb.Query(input)
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

func (r *queryResolver) MyFingerprints(ctx context.Context) (*models.QueryFingerprintResultType, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.User()

	currentUser := getCurrentUser(ctx)
	if currentUser == nil {
		return nil, user.ErrUnauthorized
	}
	res, count, err := qb.GetMyFingerprints(currentUser.ID)

	return &models.QueryFingerprintResultType{
		Count:        count,
		Fingerprints: res,
	}, err
}
