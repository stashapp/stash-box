package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/pkg/models"
)

type userResolver struct{ *Resolver }

func (r *userResolver) ID(ctx context.Context, user *models.User) (string, error) {
	return user.ID.String(), nil
}

func (r *userResolver) Roles(ctx context.Context, user *models.User) ([]models.RoleEnum, error) {
	// Limit user role visibility to admins and user themself
	if err := auth.ValidateOwner(ctx, user.ID); err != nil {
		if err := auth.ValidateRole(ctx, models.RoleEnumAdmin); err != nil {
			return nil, nil
		}
	}

	return r.services.User().GetRoles(ctx, user.ID)
}

func (r *userResolver) VoteCount(ctx context.Context, obj *models.User) (*models.UserVoteCount, error) {
	return r.services.User().CountVotesByType(ctx, obj.ID)
}

func (r *userResolver) EditCount(ctx context.Context, obj *models.User) (*models.UserEditCount, error) {
	return r.services.User().CountEditsByStatus(ctx, obj.ID)
}

func (r *userResolver) InvitedBy(ctx context.Context, user *models.User) (*models.User, error) {
	if !user.InvitedByID.Valid {
		return nil, nil
	}

	return r.services.User().FindByID(ctx, user.InvitedByID.UUID)
}

func (r *userResolver) ActiveInviteCodes(ctx context.Context, user *models.User) ([]string, error) {
	// only show if current user or invite manager
	currentUser := auth.GetCurrentUser(ctx)

	if currentUser.ID != user.ID {
		if err := auth.ValidateRole(ctx, models.RoleEnumManageInvites); err != nil {
			return nil, nil
		}
	}

	codes, err := r.InviteCodes(ctx, user)
	if err != nil {
		return nil, err
	}
	var inviteCodes []string
	for _, code := range codes {
		inviteCodes = append(inviteCodes, code.ID.String())
	}

	return inviteCodes, err
}

func (r *userResolver) InviteCodes(ctx context.Context, user *models.User) ([]models.InviteKey, error) {
	// only show if current user or invite manager
	currentUser := auth.GetCurrentUser(ctx)

	if currentUser.ID != user.ID {
		if err := auth.ValidateRole(ctx, models.RoleEnumManageInvites); err != nil {
			return nil, nil
		}
	}

	return r.services.UserToken().FindActiveInviteKeysForUser(ctx, user.ID)
}

func (r *userResolver) NotificationSubscriptions(ctx context.Context, user *models.User) ([]models.NotificationEnum, error) {
	return r.services.User().GetNotificationSubscriptions(ctx, user.ID)
}
