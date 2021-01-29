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
	return &obj.CreatedAt.Timestamp, nil
}

func (r *editCommentResolver) User(ctx context.Context, obj *models.EditComment) (*models.User, error) {
	qb := models.NewUserQueryBuilder(nil)
	user, err := qb.Find(obj.UserID)

	if err != nil {
		return nil, err
	}

	return user, nil
}
