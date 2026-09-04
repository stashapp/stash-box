package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) UpdateImageTypePreferences(ctx context.Context, input models.ImageTypePreferencesInput) (bool, error) {
	user := auth.GetCurrentUser(ctx)
	service := r.services.ImageType()

	// The two lists live in separate tables, because their keys reference
	// different vocabularies, but they are one preference to the user and are
	// written in one transaction: a failure between them would leave an
	// ordering nobody asked for.
	if err := service.SetPreferences(ctx, user.ID, input.Types, input.Groups); err != nil {
		return false, err
	}

	return true, nil
}
