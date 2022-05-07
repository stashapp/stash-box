package api

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/edit"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

var UnauthorizedUpdateErr = fmt.Errorf("Only the creator can update edits")
var AlreadyUpdatedErr = fmt.Errorf("Edits can only be amended once")

func (r *mutationResolver) SceneEdit(ctx context.Context, input models.SceneEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	currentUser := getCurrentUser(ctx)

	// create the edit
	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumScene, input.Edit)

	fac := r.getRepoFactory(ctx)

	err = fac.WithTxn(func() error {
		p := edit.Scene(fac, newEdit)
		if err := p.Edit(input, wasFieldIncludedFunc(ctx)); err != nil {
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

	if err != nil {
		return nil, err
	}

	return newEdit, nil
}

func (r *mutationResolver) SceneEditUpdate(ctx context.Context, id uuid.UUID, input models.SceneEditInput) (*models.Edit, error) {
	currentUser := getCurrentUser(ctx)

	fac := r.getRepoFactory(ctx)

	existingEdit, err := fac.Edit().Find(id)
	if err != nil {
		return nil, err
	}

	if existingEdit.UserID != currentUser.ID {
		return nil, UnauthorizedUpdateErr
	}

	if existingEdit.UpdatedAt.Timestamp != existingEdit.CreatedAt.Timestamp {
		return nil, AlreadyUpdatedErr
	}

	err = fac.WithTxn(func() error {
		p := edit.Scene(fac, existingEdit)
		if err := p.Edit(input, wasFieldIncludedFunc(ctx)); err != nil {
			return err
		}

		_, err := p.UpdateEdit()

		return err
	})

	return existingEdit, err
}

func (r *mutationResolver) StudioEdit(ctx context.Context, input models.StudioEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := getCurrentUser(ctx)

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumStudio, input.Edit)

	fac := r.getRepoFactory(ctx)

	err = fac.WithTxn(func() error {
		p := edit.Studio(fac, newEdit)
		if err := p.Edit(input, wasFieldIncludedFunc(ctx)); err != nil {
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

	if err != nil {
		return nil, err
	}

	return newEdit, nil
}

func (r *mutationResolver) StudioEditUpdate(ctx context.Context, id uuid.UUID, input models.StudioEditInput) (*models.Edit, error) {
	currentUser := getCurrentUser(ctx)

	fac := r.getRepoFactory(ctx)

	existingEdit, err := fac.Edit().Find(id)
	if err != nil {
		return nil, err
	}

	if existingEdit.UserID != currentUser.ID {
		return nil, UnauthorizedUpdateErr
	}

	if existingEdit.UpdatedAt.IsValid() {
		return nil, AlreadyUpdatedErr
	}

	err = fac.WithTxn(func() error {
		p := edit.Studio(fac, existingEdit)
		if err := p.Edit(input, wasFieldIncludedFunc(ctx)); err != nil {
			return err
		}

		_, err := p.UpdateEdit()

		return err
	})

	return existingEdit, err
}

func (r *mutationResolver) TagEdit(ctx context.Context, input models.TagEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := getCurrentUser(ctx)

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumTag, input.Edit)

	fac := r.getRepoFactory(ctx)

	err = fac.WithTxn(func() error {
		p := edit.Tag(fac, newEdit)
		if err := p.Edit(input, wasFieldIncludedFunc(ctx)); err != nil {
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

	if err != nil {
		return nil, err
	}

	return newEdit, nil
}

func (r *mutationResolver) TagEditUpdate(ctx context.Context, id uuid.UUID, input models.TagEditInput) (*models.Edit, error) {
	currentUser := getCurrentUser(ctx)

	fac := r.getRepoFactory(ctx)

	existingEdit, err := fac.Edit().Find(id)
	if err != nil {
		return nil, err
	}

	if existingEdit.UserID != currentUser.ID {
		return nil, UnauthorizedUpdateErr
	}

	if existingEdit.UpdatedAt.IsValid() {
		return nil, AlreadyUpdatedErr
	}

	err = fac.WithTxn(func() error {
		p := edit.Tag(fac, existingEdit)
		if err := p.Edit(input, wasFieldIncludedFunc(ctx)); err != nil {
			return err
		}

		_, err := p.UpdateEdit()

		return err
	})

	return existingEdit, err
}

func (r *mutationResolver) PerformerEdit(ctx context.Context, input models.PerformerEditInput) (*models.Edit, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := getCurrentUser(ctx)

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumPerformer, input.Edit)
	fac := r.getRepoFactory(ctx)
	err = fac.WithTxn(func() error {
		p := edit.Performer(fac, newEdit)
		if err := p.Edit(input, wasFieldIncludedFunc(ctx)); err != nil {
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

	if err != nil {
		return nil, err
	}

	return newEdit, nil
}

func (r *mutationResolver) PerformerEditUpdate(ctx context.Context, id uuid.UUID, input models.PerformerEditInput) (*models.Edit, error) {
	currentUser := getCurrentUser(ctx)

	fac := r.getRepoFactory(ctx)

	existingEdit, err := fac.Edit().Find(id)
	if err != nil {
		return nil, err
	}

	if existingEdit.UserID != currentUser.ID {
		return nil, UnauthorizedUpdateErr
	}

	if existingEdit.UpdatedAt.IsValid() {
		return nil, AlreadyUpdatedErr
	}

	err = fac.WithTxn(func() error {
		p := edit.Performer(fac, existingEdit)
		if err := p.Edit(input, wasFieldIncludedFunc(ctx)); err != nil {
			return err
		}

		_, err := p.UpdateEdit()

		return err
	})

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

		if err := user.ValidateOwner(ctx, voteEdit.UserID); err == nil {
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

	if err != nil {
		return nil, err
	}

	return voteEdit, nil
}

func (r *mutationResolver) EditComment(ctx context.Context, input models.EditCommentInput) (*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	currentUser := getCurrentUser(ctx)
	var edit *models.Edit
	err := fac.WithTxn(func() error {
		eqb := fac.Edit()

		var err error
		edit, err = eqb.Find(input.ID)
		if err != nil {
			return err
		}

		commentID, _ := uuid.NewV4()
		comment := models.NewEditComment(commentID, currentUser, edit, input.Comment)
		return eqb.CreateComment(*comment)
	})

	if err != nil {
		return nil, err
	}

	return edit, nil
}

func (r *mutationResolver) CancelEdit(ctx context.Context, input models.CancelEditInput) (*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	eqb := fac.Edit()

	e, err := eqb.Find(input.ID)
	if err != nil {
		return nil, err
	}

	if err = validateUser(ctx, e.UserID); err == nil {
		return edit.CloseEdit(fac, input.ID, models.VoteStatusEnumCanceled)
	} else if err = validateAdmin(ctx); err == nil {
		currentUser := getCurrentUser(ctx)

		err = fac.WithTxn(func() error {
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
