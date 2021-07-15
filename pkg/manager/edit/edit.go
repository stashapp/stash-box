package edit

import (
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

func ApplyEdit(fac models.Repo, editID uuid.UUID) (*models.Edit, error) {
	var updatedEdit *models.Edit
	err := fac.WithTxn(func() error {
		eqb := fac.Edit()
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
		utils.ResolveEnumString(edit.Status, &status)
		if status != models.VoteStatusEnumPending {
			return errors.New("Invalid vote status: " + edit.Status)
		}

		var operation models.OperationEnum
		utils.ResolveEnumString(edit.Operation, &operation)
		var targetType models.TargetTypeEnum
		utils.ResolveEnumString(edit.TargetType, &targetType)
		switch targetType {
		case models.TargetTypeEnumTag:
			tqb := fac.Tag()
			var tag *models.Tag = nil
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
			pqb := fac.Performer()
			var performer *models.Performer = nil
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
