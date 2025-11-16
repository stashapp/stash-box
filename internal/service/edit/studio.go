package edit

import (
	"context"
	"errors"
	"fmt"
	"reflect"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/pkg/utils"
)

type StudioEditProcessor struct {
	mutator
}

func Studio(ctx context.Context, queries *queries.Queries, edit *models.Edit) *StudioEditProcessor {
	return &StudioEditProcessor{
		mutator{
			context: ctx,
			queries: queries,
			edit:    edit,
		},
	}
}

func (m *StudioEditProcessor) Edit(input models.StudioEditInput, inputArgs utils.ArgumentsQuery) error {
	if err := validateStudioEditInput(m.context, m.queries, input); err != nil {
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
	// get the existing studio
	studioID := *input.Edit.ID
	dbStudio, err := m.queries.FindStudio(m.context, studioID)

	if err != nil {
		return err
	}

	studio := converter.StudioToModel(dbStudio)
	var entity editEntity = studio
	if err := validateEditEntity(&entity, studioID, "studio"); err != nil {
		return err
	}

	// perform a diff against the input and the current object
	detailArgs := inputArgs.Field("details")
	studioEdit, err := input.Details.StudioEditFromDiff(studio, detailArgs)
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

func (m *StudioEditProcessor) diffURLs(studioEdit *models.StudioEditData, studioID uuid.UUID, newURLs []models.URL) error {
	dbURLs, err := m.queries.GetStudioURLs(m.context, studioID)
	if err != nil {
		return err
	}

	var urls []models.URL
	for _, url := range dbURLs {
		urls = append(urls, models.URL{
			URL:    url.Url,
			SiteID: url.SiteID,
		})
	}
	studioEdit.New.AddedUrls, studioEdit.New.RemovedUrls = urlCompare(newURLs, urls)
	return nil
}

func (m *StudioEditProcessor) diffAliases(studioEdit *models.StudioEditData, studioID uuid.UUID, newAliases []string) error {
	aliases, err := m.queries.GetStudioAliases(m.context, studioID)
	if err != nil {
		return err
	}

	studioEdit.New.AddedAliases, studioEdit.New.RemovedAliases = utils.SliceCompare(newAliases, aliases)
	return nil
}

func (m *StudioEditProcessor) diffImages(studioEdit *models.StudioEditData, studioID uuid.UUID, newImageIds []uuid.UUID) error {
	images, err := m.queries.FindImagesByStudioID(m.context, studioID)
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
	// get the existing studio
	if input.Edit.ID == nil {
		return ErrMergeIDMissing
	}
	studioID := *input.Edit.ID
	dbStudio, err := m.queries.FindStudio(m.context, studioID)

	if err != nil {
		return fmt.Errorf("%w: target studio %s: %w", ErrEntityNotFound, studioID.String(), err)
	}

	studio := converter.StudioToModel(dbStudio)
	var mergeSources []uuid.UUID
	for _, sourceID := range input.Edit.MergeSourceIds {
		_, err := m.queries.FindStudio(m.context, sourceID)
		if err != nil {
			return fmt.Errorf("%w: source studio %s, %w", ErrEntityNotFound, sourceID.String(), err)
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
	detailArgs := inputArgs.Field("details")
	studioEdit, err := input.Details.StudioEditFromMerge(studio, mergeSources, detailArgs)
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

	studioEdit.New.AddedUrls = input.Details.Urls
	studioEdit.New.AddedImages = input.Details.ImageIds
	studioEdit.New.AddedAliases = input.Details.Aliases

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) destroyEdit(input models.StudioEditInput) error {
	// Get the existing studio
	studioID := *input.Edit.ID
	dbStudio, err := m.queries.FindStudio(m.context, studioID)
	if err != nil {
		return err
	}

	studio := converter.StudioToModel(dbStudio)
	var entity editEntity = studio
	return validateEditEntity(&entity, studioID, "studio")
}

func (m *StudioEditProcessor) CreateJoin(input models.StudioEditInput) error {
	if input.Edit.ID != nil {
		return m.queries.CreateStudioEdit(m.context, queries.CreateStudioEditParams{
			EditID:   m.edit.ID,
			StudioID: *input.Edit.ID,
		})
	}

	return nil
}

func (m *StudioEditProcessor) apply() error {
	operation := m.operation()
	isCreate := operation == models.OperationEnumCreate

	var studio *models.Studio
	if !isCreate {
		res, err := m.queries.GetEditTargetID(m.context, m.edit.ID)
		if err != nil {
			return err
		}
		dbStudio, err := m.queries.FindStudio(m.context, res.ID)

		if err != nil {
			return fmt.Errorf("%w: studio %s: %w", ErrEntityNotFound, res.ID.String(), err)
		}
		studio = converter.StudioToModelPtr(dbStudio)
	}

	data, err := m.edit.GetStudioData()
	if err != nil {
		return err
	}

	switch operation {
	case models.OperationEnumCreate:
		studioID, err := uuid.NewV7()
		if err != nil {
			return err
		}
		newStudio := models.Studio{
			ID: studioID,
		}
		if data.New.Name == nil {
			return errors.New("missing studio name")
		}
		newStudio.CopyFromStudioEdit(*data.New, &models.StudioEdit{})

		_, err = m.queries.CreateStudio(m.context, converter.StudioToCreateParams(newStudio))
		if err != nil {
			return err
		}

		if len(data.New.AddedUrls) > 0 {
			var urls []queries.CreateStudioURLsParams
			for _, url := range data.New.AddedUrls {
				urls = append(urls, queries.CreateStudioURLsParams{
					StudioID: studioID,
					Url:      url.URL,
					SiteID:   url.SiteID,
				})
			}
			_, err = m.queries.CreateStudioURLs(m.context, urls)
			if err != nil {
				return err
			}
		}

		if len(data.New.AddedImages) > 0 {
			var params []queries.CreateStudioImagesParams
			for _, image := range data.New.AddedImages {
				params = append(params, queries.CreateStudioImagesParams{
					StudioID: studioID,
					ImageID:  image,
				})
			}
			_, err := m.queries.CreateStudioImages(m.context, params)
			if err != nil {
				return err
			}
		}

		if len(data.New.AddedAliases) > 0 {
			var params []queries.CreateStudioAliasesParams
			for _, alias := range data.New.AddedAliases {
				params = append(params, queries.CreateStudioAliasesParams{
					StudioID: studioID,
					Alias:    alias,
				})
			}
			_, err := m.queries.CreateStudioAliases(m.context, params)
			if err != nil {
				return err
			}
		}

		return m.queries.CreateStudioEdit(m.context, queries.CreateStudioEditParams{
			EditID:   m.edit.ID,
			StudioID: studioID,
		})
	case models.OperationEnumDestroy:
		_, err := m.queries.SoftDeleteStudio(m.context, studio.ID)
		if err != nil {
			return err
		}

		if err := m.queries.DeleteSceneStudios(m.context, uuid.NullUUID{UUID: studio.ID, Valid: true}); err != nil {
			return err
		}
		if err = m.queries.DeleteStudioFavorites(m.context, studio.ID); err != nil {
			return err
		}

		return nil
	case models.OperationEnumModify:
		return m.applyModifyEdit(studio, data)
	case models.OperationEnumMerge:
		err := m.applyModifyEdit(studio, data)
		if err != nil {
			return err
		}

		for _, sourceID := range data.MergeSources {
			if err := m.mergeInto(sourceID, studio.ID); err != nil {
				return err
			}
		}

		return nil
	default:
		return errors.New("Unsupported operation: " + operation.String())
	}
}

func (m *StudioEditProcessor) applyModifyEdit(studio *models.Studio, data *models.StudioEditData) error {
	if err := studio.ValidateModifyEdit(*data); err != nil {
		return err
	}

	studio.CopyFromStudioEdit(*data.New, data.Old)
	updatedDbStudio, err := m.queries.UpdateStudio(m.context, converter.StudioToUpdateParams(*studio))
	if err != nil {
		return err
	}

	updatedStudio := converter.StudioToModelPtr(updatedDbStudio)
	if err := m.updateURLsFromEdit(updatedStudio, data); err != nil {
		return err
	}

	if err := m.updateImagesFromEdit(updatedStudio, data); err != nil {
		return err
	}

	if err := m.updateAliasesFromEdit(updatedStudio, data); err != nil {
		return err
	}

	return err
}

func (m *StudioEditProcessor) updateURLsFromEdit(studio *models.Studio, data *models.StudioEditData) error {
	urls, err := m.queries.GetMergedURLsForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteStudioURLs(m.context, studio.ID); err != nil {
		return err
	}

	var urlsParams []queries.CreateStudioURLsParams
	for _, url := range urls {
		urlsParams = append(urlsParams, queries.CreateStudioURLsParams{
			StudioID: studio.ID,
			Url:      url.Url,
			SiteID:   url.SiteID,
		})
	}

	_, err = m.queries.CreateStudioURLs(m.context, urlsParams)
	return err
}

func (m StudioEditProcessor) updateImagesFromEdit(studio *models.Studio, data *models.StudioEditData) error {
	dbImages, err := m.queries.GetImagesForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteStudioImages(m.context, studio.ID); err != nil {
		return err
	}

	var images []queries.CreateStudioImagesParams
	for _, image := range dbImages {
		images = append(images, queries.CreateStudioImagesParams{
			StudioID: studio.ID,
			ImageID:  image.ID,
		})
	}

	_, err = m.queries.CreateStudioImages(m.context, images)
	return err
}

func (m *StudioEditProcessor) mergeInto(sourceID uuid.UUID, targetID uuid.UUID) error {
	studio, err := m.queries.FindStudio(m.context, sourceID)
	if err != nil {
		return fmt.Errorf("merge source studio not found, %v: %w"+sourceID.String(), err)
	}
	if studio.Deleted {
		return fmt.Errorf("merge source studio is deleted, %v: %w"+sourceID.String(), err)
	}

	_, err = m.queries.SoftDeleteStudio(m.context, studio.ID)
	if err != nil {
		return err
	}
	if err = m.queries.UpdateStudioRedirects(m.context, queries.UpdateStudioRedirectsParams{
		OldTargetID: sourceID,
		NewTargetID: targetID,
	}); err != nil {
		return err
	}

	if err = m.queries.UpdateSceneStudios(m.context, queries.UpdateSceneStudiosParams{
		SourceID: uuid.NullUUID{UUID: sourceID, Valid: true},
		TargetID: uuid.NullUUID{UUID: targetID, Valid: true},
	}); err != nil {
		return err
	}

	if err = m.queries.ReassignStudioFavorites(m.context, queries.ReassignStudioFavoritesParams{
		OldStudioID: sourceID,
		NewStudioID: targetID,
	}); err != nil {
		return err
	}

	return m.queries.CreateStudioRedirect(m.context, queries.CreateStudioRedirectParams{
		SourceID: sourceID,
		TargetID: targetID,
	})

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

func (m *StudioEditProcessor) updateAliasesFromEdit(studio *models.Studio, data *models.StudioEditData) error {
	aliases, err := m.queries.GetMergedStudioAliasesForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteStudioAliases(m.context, studio.ID); err != nil {
		return err
	}

	var params []queries.CreateStudioAliasesParams
	for _, alias := range aliases {
		params = append(params, queries.CreateStudioAliasesParams{
			StudioID: studio.ID,
			Alias:    alias,
		})
	}
	_, err = m.queries.CreateStudioAliases(m.context, params)
	return err
}
