package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type userResolver struct{ *Resolver }

func (r *userResolver) ID(ctx context.Context, obj *models.User) (string, error) {
	return obj.ID.String(), nil
}

func (r *userResolver) Roles(ctx context.Context, obj *models.User) ([]models.RoleEnum, error) {
	qb := models.NewUserQueryBuilder(nil)
	roles, err := qb.GetRoles(obj.ID)

	if err != nil {
		return nil, err
	}

	return roles.ToRoles(), nil
}

func (r *userResolver) SuccessfulEdits(ctx context.Context, obj *models.User) (int, error) {
	// TODO
	return 0, nil
}

func (r *userResolver) UnsuccessfulEdits(ctx context.Context, obj *models.User) (int, error) {
	// TODO
	return 0, nil
}

func (r *userResolver) SuccessfulVotes(ctx context.Context, obj *models.User) (int, error) {
	// TODO
	return 0, nil
}

func (r *userResolver) UnsuccessfulVotes(ctx context.Context, obj *models.User) (int, error) {
	// TODO
	return 0, nil
}

func (r *userResolver) InvitedBy(ctx context.Context, obj *models.User) (*models.User, error) {
	// TODO
	return nil, nil
}

func (r *userResolver) InviteTokens(ctx context.Context, obj *models.User) (*int, error) {
	// TODO
	return nil, nil
}

func (r *userResolver) ActiveInviteCodes(ctx context.Context, obj *models.User) ([]string, error) {
	// TODO
	return nil, nil
}
