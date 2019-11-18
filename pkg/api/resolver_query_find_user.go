package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *queryResolver) FindUser(ctx context.Context, id *string, username *string) (*models.User, error) {
	panic("not implemented")
}
func (r *queryResolver) QueryUsers(ctx context.Context, sceneFilter *models.UserFilterType, filter *models.QuerySpec) (*models.QueryUsersResultType, error) {
	panic("not implemented")
}