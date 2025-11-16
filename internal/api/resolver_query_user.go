package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
)

func (r *queryResolver) FindUser(ctx context.Context, id *uuid.UUID, username *string) (*models.User, error) {
	var ret *models.User
	var err error
	if id != nil {
		ret, err = r.services.User().FindByID(ctx, *id)
	} else if username != nil {
		ret, err = r.services.User().FindByName(ctx, *username)
	}

	return ret, err
}

func (r *queryResolver) QueryUsers(ctx context.Context, input models.UserQueryInput) (*models.QueryUsersResultType, error) {
	return r.services.User().Query(ctx, input)
}

func (r *queryResolver) Me(ctx context.Context) (*models.User, error) {
	currentUser := auth.GetCurrentUser(ctx)
	if currentUser == nil {
		return nil, auth.ErrUnauthorized
	}

	return currentUser, nil
}
