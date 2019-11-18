package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) UserCreate(ctx context.Context, input models.UserCreateInput) (*models.User, error) {
	panic("not implemented")
}
func (r *mutationResolver) UserUpdate(ctx context.Context, input models.UserUpdateInput) (*models.User, error) {
	panic("not implemented")
}
func (r *mutationResolver) UserDestroy(ctx context.Context, input models.UserDestroyInput) (bool, error) {
	panic("not implemented")
}