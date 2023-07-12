package api

import (
	"context"
	"time"

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
	if err := validateVote(ctx); err != nil {
		return nil, nil
	}

	fac := r.getRepoFactory(ctx)
	qb := fac.User()

	if obj.UserID.UUID.IsNil() {
		return nil, nil
	}

	user, err := qb.Find(obj.UserID.UUID)

	if err != nil {
		return nil, err
	}

	return user, nil
}
