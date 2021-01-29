package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
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
	invitedBy := obj.InvitedByID
	if invitedBy.Valid {
		qb := models.NewUserQueryBuilder(nil)
		return qb.Find(invitedBy.UUID)
	}

	return nil, nil
}

func (r *userResolver) ActiveInviteCodes(ctx context.Context, obj *models.User) ([]string, error) {
	// only show if current user or invite manager
	currentUser := getCurrentUser(ctx)

	if currentUser.ID != obj.ID {
		if err := validateManageInvites(ctx); err != nil {
			return nil, nil
		}
	}

	qb := models.NewInviteCodeQueryBuilder(nil)
	ik, err := qb.FindActiveKeysForUser(obj.ID, config.GetActivationExpireTime())
	if err != nil {
		return nil, err
	}

	var ret []string
	for _, k := range ik {
		ret = append(ret, k.ID.String())
	}
	return ret, nil
}
