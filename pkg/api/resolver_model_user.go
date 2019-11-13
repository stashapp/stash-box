package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type userResolver struct{ *Resolver }

func (r *userResolver) Roles(ctx context.Context, obj *models.User) ([]models.RoleEnum, error) {
	panic("not implemented")
}
func (r *userResolver) Email(ctx context.Context, obj *models.User) (*string, error) {
	panic("not implemented")
}
