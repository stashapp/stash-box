package api

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) SubmitSceneDraft(ctx context.Context, input models.SceneDraftInput) (*models.DraftSubmissionStatus, error) {
	imageID, err := r.createImage(ctx, input.Image)
	if err != nil {
		return nil, err
	}
	return r.services.Draft().SubmitScene(ctx, input, imageID)
}

func (r *mutationResolver) SubmitPerformerDraft(ctx context.Context, input models.PerformerDraftInput) (*models.DraftSubmissionStatus, error) {
	imageID, err := r.createImage(ctx, input.Image)
	if err != nil {
		return nil, err
	}
	return r.services.Draft().SubmitPerformer(ctx, input, imageID)
}

func (r *mutationResolver) DestroyDraft(ctx context.Context, id uuid.UUID) (bool, error) {
	return r.services.Draft().Destroy(ctx, auth.GetCurrentUser(ctx), id)
}

func (r *mutationResolver) createImage(ctx context.Context, file *graphql.Upload) (*uuid.UUID, error) {
	var imageID *uuid.UUID
	if file != nil {
		image, err := r.services.Image().Create(ctx, models.ImageCreateInput{
			File: file,
		})
		if err != nil {
			return nil, err
		}

		if image != nil {
			imageID = &image.ID
		}
	}

	return imageID, nil
}
