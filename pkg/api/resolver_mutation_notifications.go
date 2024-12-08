package api

import (
	"context"
)

func (r *mutationResolver) MarkNotificationsRead(ctx context.Context) (bool, error) {
	return true, nil
}
