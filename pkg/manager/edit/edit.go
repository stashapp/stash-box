package edit

import (
	"errors"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
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

func validateEditPresence(edit *models.Edit) error {
	if edit == nil {
		return errors.New("Edit not found")
	}

	if edit.Applied {
		return errors.New("Edit already applied")
	}

	return nil
}

func validateEditPrerequisites(fac models.Repo, edit *models.Edit) error {
	var status models.VoteStatusEnum
	utils.ResolveEnumString(edit.Status, &status)
	if status != models.VoteStatusEnumPending {
		return errors.New("invalid vote status: " + edit.Status)
	}

	return nil
}

func ApplyEdit(fac models.Repo, editID uuid.UUID, immediate bool) (*models.Edit, error) {
	var updatedEdit *models.Edit
	err := fac.WithTxn(func() error {
		eqb := fac.Edit()
		edit, err := eqb.Find(editID)
		if err != nil {
			return err
		}

		if err := validateEditPresence(edit); err != nil {
			return err
		}
		if err := validateEditPrerequisites(fac, edit); err != nil {
			edit.Fail()
			return err
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
		case models.TargetTypeEnumScene:
			applyer = Scene(fac, edit)
		default:
			return errors.New("Not implemented: " + edit.TargetType)
		}

		if err := applyer.apply(); err != nil {
			return err
		}

		if immediate {
			edit.ImmediateAccept()
		} else {
			edit.Accept()
		}
		updatedEdit, err = eqb.Update(*edit)

		if err != nil {
			return err
		}

		userPromotionThreshold := config.GetVotePromotionThreshold()
		if userPromotionThreshold != nil {
			err = user.PromoteUserVoteRights(fac, updatedEdit.UserID, *userPromotionThreshold)
		}

		return err
	})

	return updatedEdit, err
}

func RejectEdit(fac models.Repo, editID uuid.UUID, immediate bool) (*models.Edit, error) {
	var updatedEdit *models.Edit
	err := fac.WithTxn(func() error {
		eqb := fac.Edit()
		edit, err := eqb.Find(editID)
		if err != nil {
			return err
		}

		if err := validateEditPresence(edit); err != nil {
			return err
		}
		if err := validateEditPrerequisites(fac, edit); err != nil {
			edit.Fail()
			return err
		}

		if immediate {
			edit.ImmediateReject()
		} else {
			edit.Reject()
		}

		updatedEdit, err = eqb.Update(*edit)

		return err
	})

	return updatedEdit, err
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

func IsVotingThresholdMet(fac models.Repo, edit *models.Edit) (bool, error) {
	threshold := config.GetVoteApplicationThreshold()
	if threshold == 0 {
		return false, nil
	}

	// For destructive edits we check if they've been open for a minimum period before applying
	if edit.Operation == models.OperationEnumDestroy.String() || edit.Operation == models.OperationEnumMerge.String() {
		if time.Since(edit.CreatedAt.Timestamp).Seconds() <= float64(config.GetMinDestructiveVotingPeriod()) {
			return false, nil
		}
	}

	votes, err := fac.Edit().GetVotes(edit.ID)
	if err != nil {
		return false, err
	}

	positive := 0
	negative := 0
	for _, vote := range votes {
		if vote.Vote == string(models.VoteTypeEnumAccept) {
			positive++
		} else if vote.Vote == string(models.VoteTypeEnumReject) {
			negative++
		}
	}

	thresholdMet := (positive >= threshold && negative == 0) || (negative >= threshold && positive == 0)
	return thresholdMet, nil
}
