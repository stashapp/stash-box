package api

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/manager/edit"
	"github.com/stashapp/stash-box/pkg/manager/notifications"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
	"github.com/stashapp/stash-box/pkg/utils"
)

var ErrUnauthorizedUpdate = fmt.Errorf("Only the creator can update edits")
var ErrClosedEdit = fmt.Errorf("Votes can only be cast on pending edits")
var ErrUnauthorizedBot = fmt.Errorf("You do not have permission to submit bot edits")
var ErrUpdateLimit = fmt.Errorf("Edit update limit reached")
var ErrSceneDraftRequired = fmt.Errorf("Scenes have to be submitted through drafts")

func (r *mutationResolver) SceneEdit(ctx context.Context, input models.SceneEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	currentUser := getCurrentUser(ctx)
	if err := validateBotEdit(ctx, input.Edit); err != nil {
		return nil, err
	}

	// create the edit
	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumScene, input.Edit)

	fac := r.getRepoFactory(ctx)
	if config.GetRequireSceneDraft() && input.Edit.Operation == models.OperationEnumCreate {
		if input.Details != nil && input.Details.DraftID != nil {
			draft, err := fac.Draft().Find(*input.Details.DraftID)
			if err != nil || draft == nil {
				return nil, ErrSceneDraftRequired
			}
		} else {
			return nil, ErrSceneDraftRequired
		}
	}

	err = fac.WithTxn(func() error {
		p := edit.Scene(fac, newEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs, false); err != nil {
			return err
		}

		_, err := p.CreateEdit()
		if err != nil {
			return err
		}

		if err := p.CreateJoin(input); err != nil {
			return err
		}

		if input.Details != nil && input.Details.DraftID != nil {
			if err := fac.Draft().Destroy(*input.Details.DraftID); err != nil {
				return err
			}
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err == nil {
		go notifications.OnCreateEdit(newEdit)
	}

	return newEdit, err
}

func (r *mutationResolver) SceneEditUpdate(ctx context.Context, id uuid.UUID, input models.SceneEditInput) (*models.Edit, error) {
	currentUser := getCurrentUser(ctx)

	fac := r.getRepoFactory(ctx)

	existingEdit, err := fac.Edit().Find(id)
	if err != nil {
		return nil, err
	}

	if err = validateEditUpdate(*existingEdit, currentUser); err != nil {
		return nil, err
	}

	err = fac.WithTxn(func() error {
		p := edit.Scene(fac, existingEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs, true); err != nil {
			return err
		}

		_, err := p.UpdateEdit()
		if err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err == nil {
		go notifications.OnUpdateEdit(existingEdit)
	}

	return existingEdit, err
}

func (r *mutationResolver) StudioEdit(ctx context.Context, input models.StudioEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := getCurrentUser(ctx)
	if err := validateBotEdit(ctx, input.Edit); err != nil {
		return nil, err
	}

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumStudio, input.Edit)

	fac := r.getRepoFactory(ctx)
	err = fac.WithTxn(func() error {
		p := edit.Studio(fac, newEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs); err != nil {
			return err
		}

		_, err := p.CreateEdit()
		if err != nil {
			return err
		}

		if err := p.CreateJoin(input); err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err == nil {
		go notifications.OnCreateEdit(newEdit)
	}

	return newEdit, err
}

func (r *mutationResolver) StudioEditUpdate(ctx context.Context, id uuid.UUID, input models.StudioEditInput) (*models.Edit, error) {
	currentUser := getCurrentUser(ctx)

	fac := r.getRepoFactory(ctx)

	existingEdit, err := fac.Edit().Find(id)
	if err != nil {
		return nil, err
	}

	if err = validateEditUpdate(*existingEdit, currentUser); err != nil {
		return nil, err
	}

	err = fac.WithTxn(func() error {
		p := edit.Studio(fac, existingEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs); err != nil {
			return err
		}

		_, err := p.UpdateEdit()
		if err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err == nil {
		go notifications.OnUpdateEdit(existingEdit)
	}

	return existingEdit, err
}

func (r *mutationResolver) TagEdit(ctx context.Context, input models.TagEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := getCurrentUser(ctx)
	if err := validateBotEdit(ctx, input.Edit); err != nil {
		return nil, err
	}

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumTag, input.Edit)

	fac := r.getRepoFactory(ctx)
	err = fac.WithTxn(func() error {
		p := edit.Tag(fac, newEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs); err != nil {
			return err
		}

		_, err := p.CreateEdit()
		if err != nil {
			return err
		}

		if err := p.CreateJoin(input); err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err == nil {
		go notifications.OnCreateEdit(newEdit)
	}

	return newEdit, err
}

func (r *mutationResolver) TagEditUpdate(ctx context.Context, id uuid.UUID, input models.TagEditInput) (*models.Edit, error) {
	currentUser := getCurrentUser(ctx)

	fac := r.getRepoFactory(ctx)

	existingEdit, err := fac.Edit().Find(id)
	if err != nil {
		return nil, err
	}

	if err = validateEditUpdate(*existingEdit, currentUser); err != nil {
		return nil, err
	}

	err = fac.WithTxn(func() error {
		p := edit.Tag(fac, existingEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs); err != nil {
			return err
		}

		_, err := p.UpdateEdit()
		if err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err == nil {
		go notifications.OnUpdateEdit(existingEdit)
	}

	return existingEdit, err
}

func (r *mutationResolver) PerformerEdit(ctx context.Context, input models.PerformerEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := getCurrentUser(ctx)
	if err := validateBotEdit(ctx, input.Edit); err != nil {
		return nil, err
	}

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumPerformer, input.Edit)

	fac := r.getRepoFactory(ctx)
	err = fac.WithTxn(func() error {
		p := edit.Performer(fac, newEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs, false); err != nil {
			return err
		}

		_, err := p.CreateEdit()
		if err != nil {
			return err
		}

		if err := p.CreateJoin(input); err != nil {
			return err
		}

		if input.Details != nil && input.Details.DraftID != nil {
			if err := fac.Draft().Destroy(*input.Details.DraftID); err != nil {
				return err
			}
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err == nil {
		go notifications.OnCreateEdit(newEdit)
	}

	return newEdit, err
}

func (r *mutationResolver) PerformerEditUpdate(ctx context.Context, id uuid.UUID, input models.PerformerEditInput) (*models.Edit, error) {
	currentUser := getCurrentUser(ctx)

	fac := r.getRepoFactory(ctx)

	existingEdit, err := fac.Edit().Find(id)
	if err != nil {
		return nil, err
	}

	if err = validateEditUpdate(*existingEdit, currentUser); err != nil {
		return nil, err
	}

	err = fac.WithTxn(func() error {
		p := edit.Performer(fac, existingEdit)
		inputArgs := utils.Arguments(ctx).Field("input")
		if err := p.Edit(input, inputArgs, true); err != nil {
			return err
		}

		_, err := p.UpdateEdit()
		if err != nil {
			return err
		}

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err == nil {
		go notifications.OnUpdateEdit(existingEdit)
	}

	return existingEdit, err
}

func (r *mutationResolver) EditVote(ctx context.Context, input models.EditVoteInput) (*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	currentUser := getCurrentUser(ctx)
	var voteEdit *models.Edit
	err := fac.WithTxn(func() error {
		eqb := fac.Edit()

		var err error
		voteEdit, err = eqb.Find(input.ID)
		if err != nil {
			return err
		}

		if voteEdit.Status != models.VoteStatusEnumPending.String() {
			return ErrClosedEdit
		}

		if err := user.ValidateOwner(ctx, voteEdit.UserID.UUID); err == nil {
			return user.ErrUnauthorized
		}

		vote := models.NewEditVote(currentUser, voteEdit, input.Vote)
		if err := eqb.CreateVote(*vote); err != nil {
			return err
		}

		voteEdit, err = eqb.Find(input.ID)
		if err != nil {
			return err
		}

		result, err := edit.ResolveVotingThreshold(fac, voteEdit)
		if result == models.VoteStatusEnumAccepted {
			voteEdit, err = edit.ApplyEdit(fac, input.ID, false)
			return err
		} else if result == models.VoteStatusEnumRejected {
			voteEdit, err = edit.CloseEdit(fac, input.ID, models.VoteStatusEnumRejected)
			return err
		}

		return err
	})

	if err == nil && input.Vote == models.VoteTypeEnumReject {
		go notifications.OnEditDownvote(voteEdit)
	}

	return voteEdit, err
}

func (r *mutationResolver) EditComment(ctx context.Context, input models.EditCommentInput) (*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	currentUser := getCurrentUser(ctx)
	var edit *models.Edit
	var comment *models.EditComment
	err := fac.WithTxn(func() error {
		eqb := fac.Edit()

		var err error
		edit, err = eqb.Find(input.ID)
		if err != nil {
			return err
		}

		commentID, _ := uuid.NewV4()
		comment = models.NewEditComment(commentID, currentUser, edit, input.Comment)
		return eqb.CreateComment(*comment)
	})

	if err == nil {
		go notifications.OnEditComment(comment)
	}

	return edit, err
}

func (r *mutationResolver) CancelEdit(ctx context.Context, input models.CancelEditInput) (*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	eqb := fac.Edit()

	e, err := eqb.Find(input.ID)
	if err != nil {
		return nil, err
	}

	if err = validateUser(ctx, e.UserID.UUID); err == nil {
		return edit.CloseEdit(fac, input.ID, models.VoteStatusEnumCanceled)
	} else if err = validateAdmin(ctx); err == nil {
		currentUser := getCurrentUser(ctx)

		err := fac.WithTxn(func() error {
			vote := models.NewEditVote(currentUser, e, models.VoteTypeEnumImmediateReject)
			return eqb.CreateVote(*vote)
		})
		if err != nil {
			return nil, err
		}

		return edit.CloseEdit(fac, input.ID, models.VoteStatusEnumImmediateRejected)
	}

	return nil, err
}

func (r *mutationResolver) ApplyEdit(ctx context.Context, input models.ApplyEditInput) (*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	eqb := fac.Edit()

	e, err := eqb.Find(input.ID)
	if err != nil {
		return nil, err
	}

	currentUser := getCurrentUser(ctx)

	err = fac.WithTxn(func() error {
		vote := models.NewEditVote(currentUser, e, models.VoteTypeEnumImmediateAccept)
		return eqb.CreateVote(*vote)
	})
	if err != nil {
		return nil, err
	}

	return edit.ApplyEdit(fac, input.ID, true)
}

func validateBotEdit(ctx context.Context, input *models.EditInput) error {
	if input.Bot != nil && *input.Bot {
		if err := validateBot(ctx); err != nil {
			return ErrUnauthorizedBot
		}
	}

	return nil
}

func validateEditUpdate(edit models.Edit, user *models.User) error {
	if edit.UserID.UUID != user.ID {
		return ErrUnauthorizedUpdate
	}

	if edit.UpdateCount >= config.GetEditUpdateLimit() {
		return ErrUpdateLimit
	}

	return nil
}
