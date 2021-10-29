package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

type userResolver struct{ *Resolver }

func (r *userResolver) ID(ctx context.Context, user *models.User) (string, error) {
	return user.ID.String(), nil
}

func (r *userResolver) Roles(ctx context.Context, user *models.User) ([]models.RoleEnum, error) {
	qb := r.getRepoFactory(ctx).User()
	roles, err := qb.GetRoles(user.ID)

	if err != nil {
		return nil, err
	}

	return roles.ToRoles(), nil
}

func (r *userResolver) VoteCount(ctx context.Context, obj *models.User) (*models.UserVoteCount, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.User()
	return qb.CountVotesByType(obj.ID)
}

func (r *userResolver) EditCount(ctx context.Context, obj *models.User) (*models.UserEditCount, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.User()
	return qb.CountEditsByStatus(obj.ID)
}

func (r *userResolver) InvitedBy(ctx context.Context, user *models.User) (*models.User, error) {
	invitedBy := user.InvitedByID
	if invitedBy.Valid {
		qb := r.getRepoFactory(ctx).User()
		return qb.Find(invitedBy.UUID)
	}

	return nil, nil
}

func (r *userResolver) ActiveInviteCodes(ctx context.Context, user *models.User) ([]string, error) {
	// only show if current user or invite manager
	currentUser := getCurrentUser(ctx)

	if currentUser.ID != user.ID {
		if err := validateManageInvites(ctx); err != nil {
			return nil, nil
		}
	}

	qb := r.getRepoFactory(ctx).Invite()
	ik, err := qb.FindActiveKeysForUser(user.ID, config.GetActivationExpireTime())
	if err != nil {
		return nil, err
	}

	var ret []string
	for _, k := range ik {
		ret = append(ret, k.ID.String())
	}
	return ret, nil
}
