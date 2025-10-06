package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/internal/models"
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
	if obj.UserID.UUID.IsNil() {
		return nil, nil
	}

	return r.services.User().FindByID(ctx, obj.UserID.UUID)
}

func (r *editCommentResolver) Edit(ctx context.Context, obj *models.EditComment) (*models.Edit, error) {
	return r.services.Edit().FindByID(ctx, obj.EditID)
}
