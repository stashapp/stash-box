package api

import (
	"context"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *queryResolver) FindUser(ctx context.Context, id *string, username *string) (*models.User, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	qb := models.NewUserQueryBuilder(nil)

	if id != nil {
		idUUID, _ := uuid.FromString(*id)
		return qb.Find(idUUID)
	} else if username != nil {
		return qb.FindByName(*username)
	}

	return nil, nil
}
func (r *queryResolver) QueryUsers(ctx context.Context, userFilter *models.UserFilterType, filter *models.QuerySpec) (*models.QueryUsersResultType, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	qb := models.NewUserQueryBuilder(nil)

	users, count := qb.Query(userFilter, filter)
	return &models.QueryUsersResultType{
		Users: users,
		Count: count,
	}, nil
}
