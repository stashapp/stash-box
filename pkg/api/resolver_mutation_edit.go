package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/manager/edit"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) SceneEdit(ctx context.Context, input models.SceneEditInput) (*models.Edit, error) {
	panic("not implemented")
}
func (r *mutationResolver) PerformerEdit(ctx context.Context, input models.PerformerEditInput) (*models.Edit, error) {
	panic("not implemented")
}
func (r *mutationResolver) StudioEdit(ctx context.Context, input models.StudioEditInput) (*models.Edit, error) {
	panic("not implemented")
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

	tx := database.DB.MustBeginTx(ctx, nil)

	if input.Edit.Operation == models.OperationEnumModify {
		err = edit.ModifyTagEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	} else {
		panic("not implemented")
	}

	// save the edit
	eqb := models.NewEditQueryBuilder(tx)

	created, err := eqb.Create(*newEdit)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	tagID, _ := uuid.FromString(*input.Edit.ID)

	editTag := models.EditTag{
		EditID: created.ID,
		TagID:  tagID,
	}

	err = eqb.CreateEditTag(editTag)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return newEdit, nil
}
func (r *mutationResolver) EditVote(ctx context.Context, input models.EditVoteInput) (*models.Edit, error) {
	panic("not implemented")
}
func (r *mutationResolver) EditComment(ctx context.Context, input models.EditCommentInput) (*models.Edit, error) {
	panic("not implemented")
}
