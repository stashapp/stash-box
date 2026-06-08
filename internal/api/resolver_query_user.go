package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/converter"
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

func (r *queryResolver) FindUsersByNames(ctx context.Context, names []string) ([]models.User, error) {
	if len(names) == 0 {
		return nil, nil
	}
	users, err := r.services.User().FindByNames(ctx, names)
	if err != nil {
		return nil, err
	}
	out := make([]models.User, 0, len(users))
	for _, u := range users {
		out = append(out, *converter.UserToModelPtr(u))
	}
	return out, nil
}

func (r *queryResolver) SearchUsers(ctx context.Context, term string, limit *int) ([]models.User, error) {
	l := 10
	if limit != nil {
		l = *limit
	}
	users, err := r.services.User().SearchByName(ctx, term, l)
	if err != nil {
		return nil, err
	}
	out := make([]models.User, 0, len(users))
	for _, u := range users {
		if u != nil {
			out = append(out, *u)
		}
	}
	return out, nil
}

func (r *queryResolver) Me(ctx context.Context) (*models.User, error) {
	currentUser := auth.GetCurrentUser(ctx)
	if currentUser == nil {
		return nil, auth.ErrUnauthorized
	}

	return r.services.User().FindByID(ctx, currentUser.ID)
}
