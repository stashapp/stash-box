package edit

import (
	"fmt"
	"reflect"

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

func (m *StudioEditProcessor) Edit(input models.StudioEditInput, inputSpecified InputSpecifiedFunc) error {
	var err error
	switch input.Edit.Operation {
	case models.OperationEnumModify:
		err = m.modifyEdit(input, inputSpecified)
	case models.OperationEnumMerge:
		err = m.mergeEdit(input, inputSpecified)
	case models.OperationEnumDestroy:
		err = m.destroyEdit(input, inputSpecified)
	case models.OperationEnumCreate:
		err = m.createEdit(input, inputSpecified)
	}

	return err
}

func (m *StudioEditProcessor) modifyEdit(input models.StudioEditInput, inputSpecified InputSpecifiedFunc) error {
	sqb := m.fac.Studio()

	// get the existing studio
	studioID := *input.Edit.ID
	studio, err := sqb.Find(studioID)

	if err != nil {
		return err
	}

	if studio == nil {
		return fmt.Errorf("%w: studio %s", ErrEntityNotFound, studioID.String())
	}

	// perform a diff against the input and the current object
	studioEdit := input.Details.StudioEditFromDiff(*studio)

	if err := m.diffURLs(&studioEdit, studioID, input.Details.Urls); err != nil {
		return err
	}

	if err := m.diffImages(&studioEdit, studioID, input.Details.ImageIds); err != nil {
		return err
	}

	if reflect.DeepEqual(studioEdit.Old, studioEdit.New) {
		return ErrNoChanges
	}

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) diffURLs(studioEdit *models.StudioEditData, studioID uuid.UUID, newURLs []*models.URL) error {
	sqb := m.fac.Studio()
	urls, err := sqb.GetURLs(studioID)
	if err != nil {
		return err
	}
	studioEdit.New.AddedUrls, studioEdit.New.RemovedUrls = urlCompare(newURLs, urls)
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
	studioEdit.New.AddedImages, studioEdit.New.RemovedImages = utils.UUIDSliceCompare(newImageIds, existingImages)

	return nil
}

func (m *StudioEditProcessor) mergeEdit(input models.StudioEditInput, inputSpecified InputSpecifiedFunc) error {
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
	studioEdit := input.Details.StudioEditFromMerge(*studio, mergeSources)

	urls, err := sqb.GetURLs(studioID)
	if err != nil {
		return err
	}
	studioEdit.New.AddedUrls, studioEdit.New.RemovedUrls = urlCompare(input.Details.Urls, urls)

	iqb := m.fac.Image()
	images, err := iqb.FindByStudioID(studioID)
	if err != nil {
		return err
	}

	var existingImages []uuid.UUID
	for _, image := range images {
		existingImages = append(existingImages, image.ID)
	}
	studioEdit.New.AddedImages, studioEdit.New.RemovedImages = utils.UUIDSliceCompare(input.Details.ImageIds, existingImages)

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) createEdit(input models.StudioEditInput, inputSpecified InputSpecifiedFunc) error {
	studioEdit := input.Details.StudioEditFromCreate()

	if len(input.Details.Urls) != 0 || inputSpecified("urls") {
		studioEdit.New.AddedUrls = input.Details.Urls
	}

	if len(input.Details.ImageIds) != 0 || inputSpecified("image_ids") {
		studioEdit.New.AddedImages = input.Details.ImageIds
	}

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) destroyEdit(input models.StudioEditInput, inputSpecified InputSpecifiedFunc) error {
	tqb := m.fac.Studio()

	// Get the existing studio
	studio, err := tqb.Find(*input.Edit.ID)
	if studio == nil {
		return fmt.Errorf("scene with id %v not found", *input.Edit.ID)
	}

	return err
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
