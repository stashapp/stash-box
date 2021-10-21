package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/edit"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) SceneEdit(ctx context.Context, input models.SceneEditInput) (*models.Edit, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	// TODO - handle modification of existing edit

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := getCurrentUser(ctx)

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

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err != nil {
		return nil, err
	}

	return newEdit, nil
}
func (r *mutationResolver) StudioEdit(ctx context.Context, input models.StudioEditInput) (*models.Edit, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	// TODO - handle modification of existing edit

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

func (r *mutationResolver) TagEdit(ctx context.Context, input models.TagEditInput) (*models.Edit, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	// TODO - handle modification of existing edit

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

func (r *mutationResolver) PerformerEdit(ctx context.Context, input models.PerformerEditInput) (*models.Edit, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	// TODO - handle modification of existing edit

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

		return p.CreateComment(currentUser, input.Edit.Comment)
	})

	if err != nil {
		return nil, err
	}

	return newEdit, nil
}

func (r *mutationResolver) EditVote(ctx context.Context, input models.EditVoteInput) (*models.Edit, error) {
	if err := validateVote(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	currentUser := getCurrentUser(ctx)
	var voteEdit *models.Edit
	err := fac.WithTxn(func() error {
		eqb := fac.Edit()

		editID, err := uuid.FromString(input.ID)
		if err != nil {
			return err
		}
		voteEdit, err = eqb.Find(editID)
		if err != nil {
			return err
		}

		if voteEdit.UserID == currentUser.ID {
			return ErrUnauthorized
		}

		vote := models.NewEditVote(currentUser, voteEdit, input.Vote)
		if err := eqb.CreateVote(*vote); err != nil {
			return err
		}

		voteEdit, err = eqb.Find(editID)
		if err != nil {
			return err
		}

		result, err := edit.ResolveVotingThreshold(fac, voteEdit)
		if result == models.VoteStatusEnumAccepted {
			voteEdit, err = edit.ApplyEdit(fac, editID, false)
			return err
		} else if result == models.VoteStatusEnumRejected {
			voteEdit, err = edit.RejectEdit(fac, editID, false)
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
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}
	fac := r.getRepoFactory(ctx)
	currentUser := getCurrentUser(ctx)
	var edit *models.Edit
	err := fac.WithTxn(func() error {
		eqb := fac.Edit()

		editID, err := uuid.FromString(input.ID)
		if err != nil {
			return err
		}
		edit, err = eqb.Find(editID)
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
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	editID, _ := uuid.FromString(input.ID)
	fac := r.getRepoFactory(ctx)

	e, err := fac.Edit().Find(editID)
	if err != nil {
		return nil, err
	}

	if err = validateOwner(ctx, e.UserID); err != nil {
		return nil, err
	}

	return edit.RejectEdit(fac, editID, true)
}

func (r *mutationResolver) ApplyEdit(ctx context.Context, input models.ApplyEditInput) (*models.Edit, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	editID, _ := uuid.FromString(input.ID)
	fac := r.getRepoFactory(ctx)

	return edit.ApplyEdit(fac, editID, true)
}
