package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
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

	// Votes retained from deleted users have no associated user.
	if !obj.UserID.Valid {
		return nil, nil
	}

	return dataloader.For(ctx).UserByID.Load(obj.UserID.UUID)
}
