package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) SceneEdit(ctx context.Context, input models.SceneEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().CreateSceneEdit(ctx, input)
	if err == nil {
		go r.services.Notification().OnCreateEdit(context.Background(), edit)
	}
	return edit, err
}

func (r *mutationResolver) SceneEditUpdate(ctx context.Context, id uuid.UUID, input models.SceneEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().UpdateSceneEdit(ctx, id, input)
	if err == nil {
		go r.services.Notification().OnUpdateEdit(context.Background(), edit)
	}
	return edit, err
}

func (r *mutationResolver) StudioEdit(ctx context.Context, input models.StudioEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().CreateStudioEdit(ctx, input)
	if err == nil {
		go r.services.Notification().OnCreateEdit(context.Background(), edit)
	}
	return edit, err
}

func (r *mutationResolver) StudioEditUpdate(ctx context.Context, id uuid.UUID, input models.StudioEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().UpdateStudioEdit(ctx, id, input)
	if err == nil {
		go r.services.Notification().OnUpdateEdit(context.Background(), edit)
	}
	return edit, err
}

func (r *mutationResolver) TagEdit(ctx context.Context, input models.TagEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().CreateTagEdit(ctx, input)
	if err == nil {
		go r.services.Notification().OnCreateEdit(context.Background(), edit)
	}
	return edit, err
}

func (r *mutationResolver) TagEditUpdate(ctx context.Context, id uuid.UUID, input models.TagEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().UpdateTagEdit(ctx, id, input)
	if err == nil {
		go r.services.Notification().OnUpdateEdit(context.Background(), edit)
	}
	return edit, err
}

func (r *mutationResolver) PerformerEdit(ctx context.Context, input models.PerformerEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().CreatePerformerEdit(ctx, input)
	if err == nil {
		go r.services.Notification().OnCreateEdit(context.Background(), edit)
	}
	return edit, err
}

func (r *mutationResolver) PerformerEditUpdate(ctx context.Context, id uuid.UUID, input models.PerformerEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().UpdatePerformerEdit(ctx, id, input)
	if err == nil {
		go r.services.Notification().OnUpdateEdit(context.Background(), edit)
	}
	return edit, err
}

func (r *mutationResolver) EditVote(ctx context.Context, input models.EditVoteInput) (*models.Edit, error) {
	edit, err := r.services.Edit().CreateVote(ctx, input)
	if err == nil && input.Vote == models.VoteTypeEnumReject {
		go r.services.Notification().OnEditDownvote(context.Background(), edit)
	}

	return edit, err
}

func (r *mutationResolver) EditComment(ctx context.Context, input models.EditCommentInput) (*models.Edit, error) {
	edit, comment, err := r.services.Edit().CreateComment(ctx, input)
	if err == nil {
		go r.services.Notification().OnEditComment(context.Background(), comment)
	}
	return edit, err
}

func (r *mutationResolver) CancelEdit(ctx context.Context, input models.CancelEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().Cancel(ctx, input)
	if err == nil {
		go r.services.Notification().OnCancelEdit(context.Background(), edit)
	}

	return edit, err
}

func (r *mutationResolver) ApplyEdit(ctx context.Context, input models.ApplyEditInput) (*models.Edit, error) {
	edit, err := r.services.Edit().Apply(ctx, input)
	if err == nil {
		go r.services.Notification().OnApplyEdit(context.Background(), edit)
	}

	return edit, err
}
