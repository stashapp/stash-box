package api

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/edit"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
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

func (r *mutationResolver) EditVote(_ context.Context, _ models.EditVoteInput) (*models.Edit, error) {
	panic("not implemented")
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

	var updatedEdit *models.Edit
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		editID, _ := uuid.FromString(input.ID)
		eqb := fac.Edit()
		edit, err := eqb.Find(editID)
		if err != nil {
			return err
		}
		if edit == nil {
			return errors.New("Edit not found")
		}

		if err = validateOwner(ctx, edit.UserID); err != nil {
			return err
		}

		var status models.VoteStatusEnum
		utils.ResolveEnumString(edit.Status, &status)
		if status != models.VoteStatusEnumPending {
			return errors.New("Invalid vote status: " + edit.Status)
		}

		edit.ImmediateReject()
		updatedEdit, err = eqb.Update(*edit)

		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return updatedEdit, nil
}

func (r *mutationResolver) ApplyEdit(ctx context.Context, input models.ApplyEditInput) (*models.Edit, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	editID, _ := uuid.FromString(input.ID)
	fac := r.getRepoFactory(ctx)

	return edit.ApplyEdit(fac, editID)
}
