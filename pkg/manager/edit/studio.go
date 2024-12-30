package edit

import (
	"fmt"
	"reflect"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type StudioEditProcessor struct {
	mutator
}

func Studio(fac models.Repo, edit *models.Edit) *StudioEditProcessor {
	return &StudioEditProcessor{
		mutator{
			fac:  fac,
			edit: edit,
		},
	}
}

func (m *StudioEditProcessor) Edit(input models.StudioEditInput, inputArgs utils.ArgumentsQuery) error {
	if err := validateStudioEditInput(m.fac, input); err != nil {
		return err
	}

	var err error
	switch input.Edit.Operation {
	case models.OperationEnumModify:
		err = m.modifyEdit(input, inputArgs)
	case models.OperationEnumMerge:
		err = m.mergeEdit(input, inputArgs)
	case models.OperationEnumDestroy:
		err = m.destroyEdit(input)
	case models.OperationEnumCreate:
		err = m.createEdit(input)
	}

	return err
}

func (m *StudioEditProcessor) modifyEdit(input models.StudioEditInput, inputArgs utils.ArgumentsQuery) error {
	sqb := m.fac.Studio()

	// get the existing studio
	studioID := *input.Edit.ID
	studio, err := sqb.Find(studioID)

	if err != nil {
		return err
	}

	var entity editEntity = studio
	if err := validateEditEntity(&entity, studioID, "studio"); err != nil {
		return err
	}

	// perform a diff against the input and the current object
	detailArgs := inputArgs.Field("details")
	studioEdit, err := input.Details.StudioEditFromDiff(*studio, detailArgs)
	if err != nil {
		return err
	}

	if err = m.diffRelationships(studioEdit, studioID, input, inputArgs); err != nil {
		return err
	}

	if reflect.DeepEqual(studioEdit.Old, studioEdit.New) {
		return ErrNoChanges
	}

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) diffURLs(studioEdit *models.StudioEditData, studioID uuid.UUID, newURLs []*models.URLInput) error {
	sqb := m.fac.Studio()
	urls, err := sqb.GetURLs(studioID)
	if err != nil {
		return err
	}
	studioEdit.New.AddedUrls, studioEdit.New.RemovedUrls = urlCompare(newURLs, urls)
	return nil
}

func (m *StudioEditProcessor) diffAliases(studioEdit *models.StudioEditData, studioID uuid.UUID, newAliases []string) error {
	pqb := m.fac.Studio()

	aliases, err := pqb.GetAliases(studioID)
	if err != nil {
		return err
	}
	studioEdit.New.AddedAliases, studioEdit.New.RemovedAliases = utils.SliceCompare(newAliases, aliases.ToAliases())
	return nil
}

func (m *StudioEditProcessor) diffImages(studioEdit *models.StudioEditData, studioID uuid.UUID, newImageIds []uuid.UUID) error {
	iqb := m.fac.Image()
	images, err := iqb.FindByStudioID(studioID)
	if err != nil {
		return err
	}

	var existingImages []uuid.UUID
	for _, image := range images {
		existingImages = append(existingImages, image.ID)
	}
	studioEdit.New.AddedImages, studioEdit.New.RemovedImages = utils.SliceCompare(newImageIds, existingImages)

	return nil
}

func (m *StudioEditProcessor) mergeEdit(input models.StudioEditInput, inputArgs utils.ArgumentsQuery) error {
	sqb := m.fac.Studio()

	// get the existing studio
	if input.Edit.ID == nil {
		return ErrMergeIDMissing
	}
	studioID := *input.Edit.ID
	studio, err := sqb.Find(studioID)

	if err != nil {
		return err
	}

	if studio == nil {
		return fmt.Errorf("%w: target studio %s", ErrEntityNotFound, studioID.String())
	}

	var mergeSources []uuid.UUID
	for _, sourceID := range input.Edit.MergeSourceIds {
		sourceStudio, err := sqb.Find(sourceID)
		if err != nil {
			return err
		}

		if sourceStudio == nil {
			return fmt.Errorf("%w: source studio %s", ErrEntityNotFound, sourceID.String())
		}
		if studioID == sourceID {
			return ErrMergeTargetIsSource
		}
		mergeSources = append(mergeSources, sourceID)
	}

	if len(mergeSources) < 1 {
		return ErrNoMergeSources
	}

	// perform a diff against the input and the current object
	studioEdit, err := input.Details.StudioEditFromMerge(*studio, mergeSources, inputArgs)
	if err != nil {
		return err
	}

	if err = m.diffRelationships(studioEdit, studioID, input, inputArgs); err != nil {
		return err
	}

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) createEdit(input models.StudioEditInput) error {
	studioEdit := input.Details.StudioEditFromCreate()

	studioEdit.New.AddedUrls = models.ParseURLInput(input.Details.Urls)
	studioEdit.New.AddedImages = input.Details.ImageIds
	studioEdit.New.AddedAliases = input.Details.Aliases

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) destroyEdit(input models.StudioEditInput) error {
	tqb := m.fac.Studio()

	// Get the existing studio
	studioID := *input.Edit.ID
	studio, err := tqb.Find(*input.Edit.ID)
	if err != nil {
		return err
	}

	var entity editEntity = studio
	return validateEditEntity(&entity, studioID, "studio")
}

func (m *StudioEditProcessor) CreateJoin(input models.StudioEditInput) error {
	if input.Edit.ID != nil {
		editStudio := models.EditStudio{
			EditID:   m.edit.ID,
			StudioID: *input.Edit.ID,
		}

		return m.fac.Edit().CreateEditStudio(editStudio)
	}

	return nil
}

func (m *StudioEditProcessor) apply() error {
	sqb := m.fac.Studio()
	eqb := m.fac.Edit()
	operation := m.operation()
	isCreate := operation == models.OperationEnumCreate

	var studio *models.Studio
	if !isCreate {
		studioID, err := eqb.FindStudioID(m.edit.ID)
		if err != nil {
			return err
		}
		studio, err = sqb.Find(*studioID)
		if err != nil {
			return err
		}
		if studio == nil {
			return fmt.Errorf("%w: studio %s", ErrEntityNotFound, studioID.String())
		}
		studio.UpdatedAt = time.Now()
	}

	newStudio, err := sqb.ApplyEdit(*m.edit, operation, studio)
	if err != nil {
		return err
	}

	if isCreate {
		editStudio := models.EditStudio{
			EditID:   m.edit.ID,
			StudioID: newStudio.ID,
		}

		err = eqb.CreateEditStudio(editStudio)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *StudioEditProcessor) diffRelationships(studioEdit *models.StudioEditData, studioID uuid.UUID, input models.StudioEditInput, inputArgs utils.ArgumentsQuery) error {
	if input.Details.Urls != nil || inputArgs.Field("urls").IsNull() {
		if err := m.diffURLs(studioEdit, studioID, input.Details.Urls); err != nil {
			return err
		}
	}

	if input.Details.ImageIds != nil || inputArgs.Field("image_ids").IsNull() {
		if err := m.diffImages(studioEdit, studioID, input.Details.ImageIds); err != nil {
			return err
		}
	}

	if input.Details.Aliases != nil || inputArgs.Field("aliases").IsNull() {
		if err := m.diffAliases(studioEdit, studioID, input.Details.Aliases); err != nil {
			return err
		}
	}
	return nil
}
