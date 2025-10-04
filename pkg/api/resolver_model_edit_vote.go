package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type editVoteResolver struct{ *Resolver }

func (r *editVoteResolver) Vote(ctx context.Context, obj *models.EditVote) (models.VoteTypeEnum, error) {
	var ret models.VoteTypeEnum
	if !utils.ResolveEnumString(obj.Vote, &ret) {
		return "", nil
	}
	return ret, nil
}

func (r *editVoteResolver) Date(ctx context.Context, obj *models.EditVote) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *editVoteResolver) User(ctx context.Context, obj *models.EditVote) (*models.User, error) {
	// User votes only available to users with vote permission
	if err := auth.ValidateRole(ctx, models.RoleEnumVote); err != nil {
		return nil, nil
	}

	return r.services.User().FindByID(ctx, obj.UserID)
}
