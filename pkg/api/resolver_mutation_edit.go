package api

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/edit"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) SceneEdit(ctx context.Context, input models.SceneEditInput) (*models.Edit, error) {
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

	err = fac.WithTxn(func() error {
		if input.Edit.Operation == models.OperationEnumModify {
			err = edit.ModifyTagEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

			if err != nil {
				return err
			}
		} else if input.Edit.Operation == models.OperationEnumMerge {
			err = edit.MergeTagEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

			if err != nil {
				return err
			}
		} else if input.Edit.Operation == models.OperationEnumDestroy {
			err = edit.DestroyTagEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

			if err != nil {
				return err
			}
		} else if input.Edit.Operation == models.OperationEnumCreate {
			err = edit.CreateTagEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

			if err != nil {
				return err
			}
		} else {
			panic("not implemented")
		}

		// save the edit
		eqb := r.getRepoFactory(ctx).Edit()

		created, err := eqb.Create(*newEdit)
		if err != nil {
			return err
		}

		if input.Edit.ID != nil {
			tagID, _ := uuid.FromString(*input.Edit.ID)

			editTag := models.EditTag{
				EditID: created.ID,
				TagID:  tagID,
			}

			err = eqb.CreateEditTag(editTag)
			if err != nil {
				return err
			}
		}

		if input.Edit.Comment != nil && len(*input.Edit.Comment) > 0 {
			commentID, _ := uuid.NewV4()
			comment := models.NewEditComment(commentID, currentUser, created, *input.Edit.Comment)
			if err := eqb.CreateComment(*comment); err != nil {
				return err
			}
		}

		return nil
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

	err = fac.WithTxn(func() error {
		if input.Edit.Operation == models.OperationEnumModify {
			err = edit.ModifyPerformerEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

			if err != nil {
				return err
			}
		} else if input.Edit.Operation == models.OperationEnumMerge {
			err = edit.MergePerformerEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

			if err != nil {
				return err
			}
		} else if input.Edit.Operation == models.OperationEnumDestroy {
			err = edit.DestroyPerformerEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

			if err != nil {
				return err
			}
		} else if input.Edit.Operation == models.OperationEnumCreate {
			err = edit.CreatePerformerEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

			if err != nil {
				return err
			}
		} else {
			panic("not implemented")
		}

		// save the edit
		eqb := r.getRepoFactory(ctx).Edit()

		created, err := eqb.Create(*newEdit)
		if err != nil {
			return err
		}

		if input.Edit.ID != nil {
			performerID, _ := uuid.FromString(*input.Edit.ID)

			editPerformer := models.EditPerformer{
				EditID:      created.ID,
				PerformerID: performerID,
			}

			err = eqb.CreateEditPerformer(editPerformer)
			if err != nil {
				return err
			}
		}

		if input.Edit.Comment != nil && len(*input.Edit.Comment) > 0 {
			commentID, _ := uuid.NewV4()
			comment := models.NewEditComment(commentID, currentUser, created, *input.Edit.Comment)
			if err := eqb.CreateComment(*comment); err != nil {
				return err
			}
		}

		return nil
	})

	// Commit
	if err != nil {
		return nil, err
	}

	return newEdit, nil
}

func (r *mutationResolver) EditVote(ctx context.Context, input models.EditVoteInput) (*models.Edit, error) {
	panic("not implemented")
}
func (r *mutationResolver) EditComment(ctx context.Context, input models.EditCommentInput) (*models.Edit, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	currentUser := getCurrentUser(ctx)
	err := fac.WithTxn(func() error {
		eqb := r.getRepoFactory(ctx).Edit()

		editID, err := uuid.FromString(input.ID)
		if err != nil {
			return err
		}
		edit, err := eqb.Find(editID)
		if err != nil {
			return err
		}

		commentID, _ := uuid.NewV4()
		comment := models.NewEditComment(commentID, currentUser, edit, input.Comment)
		if err := eqb.CreateComment(*comment); err != nil {
			return err
		}

		return nil
	})

	// Commit
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

	fac.WithTxn(func() error {
		editID, _ := uuid.FromString(input.ID)
		eqb := r.getRepoFactory(ctx).Edit()
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
		resolveEnumString(edit.Status, &status)
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

	var updatedEdit *models.Edit

	err := fac.WithTxn(func() error {
		editID, _ := uuid.FromString(input.ID)
		eqb := r.getRepoFactory(ctx).Edit()
		edit, err := eqb.Find(editID)
		if err != nil {
			return err
		}
		if edit == nil {
			return errors.New("Edit not found")
		}

		if edit.Applied {
			return errors.New("Edit already applied")
		}

		var status models.VoteStatusEnum
		resolveEnumString(edit.Status, &status)
		if status != models.VoteStatusEnumPending {
			return errors.New("Invalid vote status: " + edit.Status)
		}

		var operation models.OperationEnum
		resolveEnumString(edit.Operation, &operation)
		var targetType models.TargetTypeEnum
		resolveEnumString(edit.TargetType, &targetType)
		switch targetType {
		case models.TargetTypeEnumTag:
			tqb := r.getRepoFactory(ctx).Tag()
			var tag *models.Tag
			if operation != models.OperationEnumCreate {
				tagID, err := eqb.FindTagID(edit.ID)
				if err != nil {
					return err
				}
				tag, err = tqb.Find(*tagID)
				if err != nil {
					return err
				}
				if tag == nil {
					return errors.New("Tag not found: " + tagID.String())
				}
			}
			newTag, err := tqb.ApplyEdit(*edit, operation, tag)
			if err != nil {
				return err
			}

			if operation == models.OperationEnumCreate {
				editTag := models.EditTag{
					EditID: edit.ID,
					TagID:  newTag.ID,
				}

				err = eqb.CreateEditTag(editTag)
				if err != nil {
					return err
				}
			}
		case models.TargetTypeEnumPerformer:
			pqb := r.getRepoFactory(ctx).Performer()
			var performer *models.Performer
			if operation != models.OperationEnumCreate {
				performerID, err := eqb.FindPerformerID(edit.ID)
				if err != nil {
					return err
				}
				performer, err = pqb.Find(*performerID)
				if err != nil {
					return err
				}
				if performer == nil {
					return errors.New("Performer not found: " + performerID.String())
				}
			}
			newPerformer, err := pqb.ApplyEdit(*edit, operation, performer)
			if err != nil {
				return err
			}

			if operation == models.OperationEnumCreate {
				editPerformer := models.EditPerformer{
					EditID:      edit.ID,
					PerformerID: newPerformer.ID,
				}

				err = eqb.CreateEditPerformer(editPerformer)
				if err != nil {
					return err
				}
			}
		default:
			return errors.New("Not implemented: " + edit.TargetType)
		}

		if err != nil {
			return err
		}

		edit.ImmediateAccept()
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
