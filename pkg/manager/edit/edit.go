package edit

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/manager/notifications"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
	"github.com/stashapp/stash-box/pkg/utils"
)

var ErrNoChanges = errors.New("edit contains no changes")
var ErrMergeIDMissing = errors.New("merge target ID is required")
var ErrMergeTargetIsSource = errors.New("merge target cannot be used as source")
var ErrNoMergeSources = errors.New("no merge sources found")

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

func (m *mutator) UpdateEdit() (*models.Edit, error) {
	m.edit.UpdateCount++
	m.edit.UpdatedAt = sql.NullTime{Time: time.Now(), Valid: true}
	updated, err := m.fac.Edit().Update(*m.edit)
	if err != nil {
		return nil, err
	}

	if err = m.fac.Edit().ResetVotes(m.edit.ID); err != nil {
		return nil, err
	}

	m.edit = updated
	return updated, nil
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
		}

		success := true
		if err := applyer.apply(); err != nil {
			// Failed apply, so we reset the txn in case it was a postgres error which would block further queries
			if err := fac.ResetTxn(); err != nil {
				return fmt.Errorf("Failed to reset failed transaction: %w", err)
			}

			success = false
			commentID, _ := uuid.NewV4()
			text := "###### Edit application failed: ######\n"
			if prereqErr := (*models.ErrEditPrerequisiteFailed)(nil); errors.As(err, &prereqErr) {
				text = fmt.Sprintf("%sPrerequisite failed: %v", text, err)
			} else {
				text = fmt.Sprintf("%sUnknown Error: %v", text, err)
			}
			modUser := user.GetModUser(fac)
			comment := models.NewEditComment(commentID, modUser, edit, text)

			if err := eqb.CreateComment(*comment); err != nil {
				return err
			}
		}

		switch {
		case !success:
			edit.Fail()
		case immediate:
			edit.ImmediateAccept()
		default:
			edit.Accept()
		}
		updatedEdit, err = eqb.Update(*edit)
		if err != nil {
			return err
		}

		if success {
			userPromotionThreshold := config.GetVotePromotionThreshold()
			if userPromotionThreshold != nil && updatedEdit.UserID.Valid {
				return user.PromoteUserVoteRights(fac, updatedEdit.UserID.UUID, *userPromotionThreshold)
			}
		}

		return nil
	})

	if err == nil {
		go notifications.OnApplyEdit(updatedEdit)
	}

	return updatedEdit, err
}

func CloseEdit(fac models.Repo, editID uuid.UUID, status models.VoteStatusEnum) (*models.Edit, error) {
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

		switch status {
		case models.VoteStatusEnumImmediateRejected:
			edit.ImmediateReject()
		case models.VoteStatusEnumRejected:
			edit.Reject()
		case models.VoteStatusEnumCanceled:
			edit.Cancel()
		default:
			return fmt.Errorf("tried to close with invalid status: %s", status)
		}

		updatedEdit, err = eqb.Update(*edit)

		return err
	})

	if err == nil && status != models.VoteStatusEnumCanceled {
		go notifications.OnCancelEdit(updatedEdit)
	}

	return updatedEdit, err
}

func urlCompare(subject []*models.URLInput, against []*models.URL) (added []*models.URL, missing []*models.URL) {
	for _, s := range subject {
		newMod := true
		for _, a := range against {
			if s.URL == a.URL && s.SiteID == a.SiteID {
				newMod = false
			}
		}

		for _, a := range added {
			if s.URL == a.URL && s.SiteID == a.SiteID {
				newMod = false
			}
		}

		if newMod {
			newURL := s.ToURL()
			if newURL != nil {
				added = append(added, newURL)
			}
		}
	}

	for _, s := range against {
		removedMod := true
		for _, a := range subject {
			if s.URL == a.URL && s.SiteID == a.SiteID {
				removedMod = false
			}
		}

		for _, a := range missing {
			if s.URL == a.URL && s.SiteID == a.SiteID {
				removedMod = false
			}
		}

		if removedMod {
			missing = append(missing, s)
		}
	}
	return
}

func ResolveVotingThreshold(fac models.Repo, edit *models.Edit) (models.VoteStatusEnum, error) {
	threshold := config.GetVoteApplicationThreshold()
	if threshold == 0 {
		return models.VoteStatusEnumPending, nil
	}

	// For destructive edits we check if they've been open for a minimum period before applying
	if edit.IsDestructive() {
		if time.Since(edit.CreatedAt).Seconds() <= float64(config.GetMinDestructiveVotingPeriod()) {
			return models.VoteStatusEnumPending, nil
		}
	}

	votes, err := fac.Edit().GetVotes(edit.ID)
	if err != nil {
		return models.VoteStatusEnumPending, err
	}

	positive := 0
	negative := 0
	for _, vote := range votes {
		if vote.Vote == models.VoteTypeEnumAccept.String() {
			positive++
		} else if vote.Vote == models.VoteTypeEnumReject.String() {
			negative++
		}
	}

	if positive >= threshold && negative == 0 {
		return models.VoteStatusEnumAccepted, nil
	} else if negative >= threshold && positive == 0 {
		return models.VoteStatusEnumRejected, nil
	}

	return models.VoteStatusEnumPending, nil
}
