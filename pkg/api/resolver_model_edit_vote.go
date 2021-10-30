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
	return &obj.CreatedAt.Timestamp, nil
}

func (r *editVoteResolver) User(ctx context.Context, obj *models.EditVote) (*models.User, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.User()
	user, err := qb.Find(obj.UserID)

	if err != nil {
		return nil, err
	}

	return user, nil
}
