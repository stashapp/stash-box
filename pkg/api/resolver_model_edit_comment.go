package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/pkg/models"
)

type editCommentResolver struct{ *Resolver }

func (r *editCommentResolver) ID(ctx context.Context, obj *models.EditComment) (string, error) {
	return obj.ID.String(), nil
}

func (r *editCommentResolver) Comment(ctx context.Context, obj *models.EditComment) (string, error) {
	return obj.Text, nil
}

func (r *editCommentResolver) Date(ctx context.Context, obj *models.EditComment) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *editCommentResolver) User(ctx context.Context, obj *models.EditComment) (*models.User, error) {
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

func (r *editCommentResolver) Edit(ctx context.Context, obj *models.EditComment) (*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()

	return qb.Find(obj.EditID)
}
