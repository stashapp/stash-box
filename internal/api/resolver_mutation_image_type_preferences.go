package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) UpdateImageTypePreferences(ctx context.Context, input models.ImageTypePreferencesInput) (bool, error) {
	user := auth.GetCurrentUser(ctx)
	service := r.services.ImageType()

	if err := service.SetPreferences(ctx, user.ID, input.Types, input.Groups); err != nil {
		return false, err
	}

	return true, nil
}
