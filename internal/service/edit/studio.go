package edit

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type StudioEditProcessor struct {
	mutator
}

func Studio(ctx context.Context, queries *db.Queries, edit *models.Edit) *StudioEditProcessor {
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
	dbURLs, err := m.queries.GetStudioURLs(m.context, studioID)
	if err != nil {
		return err
	}

	var urls []*models.URL
	for _, url := range dbURLs {
		urls = append(urls, &models.URL{
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
	studioEdit, err := input.Details.StudioEditFromMerge(*studio, mergeSources, detailArgs)
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

	var urls []*models.URL
	for _, url := range input.Details.Urls {
		u := converter.URLInputToURL(*url)
		urls = append(urls, &u)
	}
	studioEdit.New.AddedUrls = urls
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
		return m.queries.CreateStudioEdit(m.context, db.CreateStudioEditParams{
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
		studio = converter.StudioToModel(dbStudio)
		studio.UpdatedAt = time.Now()
	}

	data, err := m.edit.GetStudioData()
	if err != nil {
		return err
	}

	switch operation {
	case models.OperationEnumCreate:
		now := time.Now()
		UUID, err := uuid.NewV4()
		if err != nil {
			return err
		}
		newStudio := models.Studio{
			ID:        UUID,
			CreatedAt: now,
			UpdatedAt: now,
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
			var urls []db.CreateStudioURLsParams
			for _, url := range data.New.AddedUrls {
				urls = append(urls, db.CreateStudioURLsParams{
					StudioID: newStudio.ID,
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
			var params []db.CreateStudioImagesParams
			for _, image := range data.New.AddedImages {
				params = append(params, db.CreateStudioImagesParams{
					StudioID: studio.ID,
					ImageID:  image,
				})
			}
			_, err := m.queries.CreateStudioImages(m.context, params)
			if err != nil {
				return err
			}
		}

		if len(data.New.AddedAliases) > 0 {
			var params []db.CreateStudioAliasesParams
			for _, alias := range data.New.AddedAliases {
				params = append(params, db.CreateStudioAliasesParams{
					StudioID: studio.ID,
					Alias:    alias,
				})
			}
			_, err := m.queries.CreateStudioAliases(m.context, params)
			if err != nil {
				return err
			}
		}

		return m.queries.CreateStudioEdit(m.context, db.CreateStudioEditParams{
			EditID:   m.edit.ID,
			StudioID: newStudio.ID,
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

	updatedStudio := converter.StudioToModel(updatedDbStudio)
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

	var urlsParams []db.CreateStudioURLsParams
	for _, url := range urls {
		urlsParams = append(urlsParams, db.CreateStudioURLsParams{
			StudioID: studio.ID,
			Url:      url.Url,
			SiteID:   url.SiteID,
		})
	}

	_, err = m.queries.CreateStudioURLs(m.context, urlsParams)
	return err
}

func (m StudioEditProcessor) GetEditImages(id *uuid.UUID, data *models.StudioEdit) ([]uuid.UUID, error) {
	var imageIds []uuid.UUID
	if id != nil {
		currentImages, err := m.queries.GetStudioImages(m.context, *id)
		if err != nil {
			return nil, err
		}
		imageIds = append(imageIds, currentImages...)
	}
	return utils.ProcessSlice(imageIds, data.AddedImages, data.RemovedImages), nil
}

func (m StudioEditProcessor) updateImagesFromEdit(studio *models.Studio, data *models.StudioEditData) error {
	ids, err := m.GetEditImages(&studio.ID, data.New)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteStudioImages(m.context, studio.ID); err != nil {
		return err
	}

	var images []db.CreateStudioImagesParams
	for _, image := range ids {
		images = append(images, db.CreateStudioImagesParams{
			StudioID: studio.ID,
			ImageID:  image,
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
	if err = m.queries.UpdateStudioRedirects(m.context, db.UpdateStudioRedirectsParams{
		OldTargetID: sourceID,
		NewTargetID: targetID,
	}); err != nil {
		return err
	}

	if err = m.queries.UpdateSceneStudios(m.context, db.UpdateSceneStudiosParams{
		SourceID: uuid.NullUUID{UUID: sourceID, Valid: true},
		TargetID: uuid.NullUUID{UUID: targetID, Valid: true},
	}); err != nil {
		return err
	}

	if err = m.queries.ReassignStudioFavorites(m.context, db.ReassignStudioFavoritesParams{
		OldStudioID: sourceID,
		NewStudioID: targetID,
	}); err != nil {
		return err
	}

	return m.queries.CreateStudioRedirect(m.context, db.CreateStudioRedirectParams{
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

func (m *StudioEditProcessor) GetEditAliases(id *uuid.UUID, data *models.StudioEdit) ([]string, error) {
	var aliases []string
	if id != nil {
		currentAliases, err := m.queries.GetStudioAliases(m.context, *id)
		if err != nil {
			return nil, err
		}
		aliases = currentAliases
	}

	return utils.ProcessSlice(aliases, data.AddedAliases, data.RemovedAliases), nil
}

func (m *StudioEditProcessor) updateAliasesFromEdit(studio *models.Studio, data *models.StudioEditData) error {
	aliases, err := m.GetEditAliases(&studio.ID, data.New)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteStudioAliases(m.context, studio.ID); err != nil {
		return err
	}

	var params []db.CreateStudioAliasesParams
	for _, alias := range aliases {
		params = append(params, db.CreateStudioAliasesParams{
			StudioID: studio.ID,
			Alias:    alias,
		})
	}
	_, err = m.queries.CreateStudioAliases(m.context, params)
	return err
}
