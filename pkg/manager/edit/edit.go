package edit

import (
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

// InputSpecifiedFunc is function that returns true if the qualified field name
// was specified in the input. Used to distinguish between nil/empty fields and
// unspecified fields
type InputSpecifiedFunc func(qualifiedField string) bool

type mutator struct {
	edit *models.Edit
	fac  models.Repo
}

func (m *mutator) operation() models.OperationEnum {
	var operation models.OperationEnum
	utils.ResolveEnumString(m.edit.Operation, &operation)
	return operation
}

func (m *mutator) CreateEdit() (*models.Edit, error) {
	created, err := m.fac.Edit().Create(*m.edit)
	if err != nil {
		return nil, err
	}

	m.edit = created
	return created, nil
}

func (m *mutator) CreateComment(user *models.User, comment *string) error {
	if comment != nil && len(*comment) > 0 {
		commentID, _ := uuid.NewV4()
		comment := models.NewEditComment(commentID, user, m.edit, *comment)
		return m.fac.Edit().CreateComment(*comment)
	}

	return nil
}

type editApplyer interface {
	apply() error
}

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

		var applyer editApplyer
		switch targetType {
		case models.TargetTypeEnumTag:
			applyer = Tag(fac, edit)
		case models.TargetTypeEnumPerformer:
			applyer = Performer(fac, edit)
		case models.TargetTypeEnumStudio:
			applyer = Studio(fac, edit)
		default:
			return errors.New("Not implemented: " + edit.TargetType)
		}

		if err := applyer.apply(); err != nil {
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

func urlCompare(subject []*models.URL, against []*models.URL) (added []*models.URL, missing []*models.URL) {
	for _, s := range subject {
		newMod := true
		for _, a := range against {
			if s.URL == a.URL {
				newMod = false
			}
		}

		for _, a := range added {
			if s.URL == a.URL {
				newMod = false
			}
		}

		if newMod {
			added = append(added, s)
		}
	}

	for _, s := range against {
		removedMod := true
		for _, a := range subject {
			if s.URL == a.URL {
				removedMod = false
			}
		}

		for _, a := range missing {
			if s.URL == a.URL {
				removedMod = false
			}
		}

		if removedMod {
			missing = append(missing, s)
		}
	}
	return
}
