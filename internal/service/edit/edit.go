package edit

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
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
	context context.Context
	edit    *models.Edit
	queries *db.Queries
}

func (m *mutator) operation() models.OperationEnum {
	var operation models.OperationEnum
	utils.ResolveEnumString(m.edit.Operation, &operation)
	return operation
}

func (m *mutator) CreateEdit() (*models.Edit, error) {
	created, err := m.queries.CreateEdit(m.context, converter.EditToCreateParams(*m.edit))
	if err != nil {
		return nil, err
	}

	converted := converter.EditToModelPtr(created)
	m.edit = converted
	return converted, nil
}

func (m *mutator) UpdateEdit() error {
	m.edit.UpdateCount++
	_, err := m.queries.UpdateEdit(m.context, converter.EditToUpdateParams(*m.edit))
	if err != nil {
		return err
	}

	return m.queries.ResetVotes(m.context, m.edit.ID)
}

func (m *mutator) CreateComment(user *models.User, comment *string) error {
	if comment != nil && len(*comment) > 0 {
		commentID, _ := uuid.NewV4()
		comment := models.NewEditComment(commentID, user.ID, m.edit, *comment)
		_, err := m.queries.CreateEditComment(m.context, converter.EditCommentToCreateParams(*comment))
		return err
	}

	return nil
}

type editApplyer interface {
	apply() error
}

func urlCompare(subject []models.URL, against []models.URL) (added []models.URL, missing []models.URL) {
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
			added = append(added, s)
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
