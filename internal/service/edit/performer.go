package edit

import (
	"context"
	"fmt"
	"reflect"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type PerformerEditProcessor struct {
	mutator
}

func Performer(ctx context.Context, queries *db.Queries, edit *models.Edit) *PerformerEditProcessor {
	return &PerformerEditProcessor{
		mutator{
			context: ctx,
			queries: queries,
			edit:    edit,
		},
	}
}

func (m *PerformerEditProcessor) Edit(input models.PerformerEditInput, inputArgs utils.ArgumentsQuery, update bool) error {
	if err := validatePerformerEditInput(m.context, m.queries, input, m.edit, update); err != nil {
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
		err = m.createEdit(input, inputArgs)
	}

	return err
}

func (m *PerformerEditProcessor) modifyEdit(input models.PerformerEditInput, inputArgs utils.ArgumentsQuery) error {
	// get the existing performer
	performerID := *input.Edit.ID
	dbPerformer, err := m.queries.FindPerformer(m.context, performerID)

	if err != nil {
		return err
	}

	performer := converter.PerformerToModel(dbPerformer)
	var entity editEntity = *performer
	if err := validateEditEntity(&entity, *input.Edit.ID, "performer"); err != nil {
		return err
	}

	// perform a diff against the input and the current object
	detailArgs := inputArgs.Field("details")
	performerEdit, err := input.Details.PerformerEditFromDiff(*performer, detailArgs)
	if err != nil {
		return err
	}

	if err = m.diffRelationships(performerEdit, performerID, input, inputArgs); err != nil {
		return err
	}

	if input.Options != nil && input.Options.SetModifyAliases != nil {
		performerEdit.SetModifyAliases = *input.Options.SetModifyAliases
	}

	if reflect.DeepEqual(performerEdit.Old, performerEdit.New) {
		return ErrNoChanges
	}

	performerEdit.New.DraftID = input.Details.DraftID

	return m.edit.SetData(*performerEdit)
}

func (m *PerformerEditProcessor) mergeEdit(input models.PerformerEditInput, inputArgs utils.ArgumentsQuery) error {
	// get the existing performer
	if input.Edit.ID == nil {
		return ErrMergeIDMissing
	}
	performerID := *input.Edit.ID
	dbPerformer, err := m.queries.FindPerformer(m.context, performerID)

	if err != nil {
		return fmt.Errorf("performer with id %v not found: %w", *input.Edit.ID, err)
	}

	var mergeSources []uuid.UUID
	for _, sourceID := range input.Edit.MergeSourceIds {
		_, err := m.queries.FindPerformer(m.context, sourceID)
		if err != nil {
			return fmt.Errorf("performer with id %v not found: %w", sourceID, err)
		}
		if performerID == sourceID {
			return ErrMergeTargetIsSource
		}
		mergeSources = append(mergeSources, sourceID)
	}

	if len(mergeSources) < 1 {
		return ErrNoMergeSources
	}

	// perform a diff against the input and the current object
	performer := converter.PerformerToModel(dbPerformer)
	detailArgs := inputArgs.Field("details")
	performerEdit, err := input.Details.PerformerEditFromMerge(*performer, mergeSources, detailArgs)
	if err != nil {
		return err
	}

	if err = m.diffRelationships(performerEdit, performerID, input, inputArgs); err != nil {
		return err
	}

	if input.Options != nil && input.Options.SetMergeAliases != nil {
		performerEdit.SetMergeAliases = *input.Options.SetMergeAliases
	}
	if input.Options != nil && input.Options.SetModifyAliases != nil {
		performerEdit.SetModifyAliases = *input.Options.SetModifyAliases
	}

	return m.edit.SetData(*performerEdit)
}

func (m *PerformerEditProcessor) createEdit(input models.PerformerEditInput, inputArgs utils.ArgumentsQuery) error {
	performerEdit, err := input.Details.PerformerEditFromCreate(inputArgs)
	if err != nil {
		return err
	}

	performerEdit.New.AddedAliases = input.Details.Aliases
	performerEdit.New.AddedTattoos = converter.BodyModInputToModel(input.Details.Tattoos)
	performerEdit.New.AddedPiercings = converter.BodyModInputToModel(input.Details.Piercings)
	performerEdit.New.AddedImages = input.Details.ImageIds

	var addedUrls []*models.URL
	for _, url := range input.Details.Urls {
		addedUrls = append(addedUrls, &models.URL{URL: url.URL, SiteID: url.SiteID})
	}
	performerEdit.New.AddedUrls = addedUrls

	performerEdit.New.DraftID = input.Details.DraftID

	return m.edit.SetData(*performerEdit)
}

func (m *PerformerEditProcessor) destroyEdit(input models.PerformerEditInput) error {
	// get the existing performer
	performerID := *input.Edit.ID
	dbPerformer, err := m.queries.FindPerformer(m.context, performerID)
	if err != nil {
		return err
	}

	performer := converter.PerformerToModel(dbPerformer)
	var entity editEntity = *performer
	return validateEditEntity(&entity, performerID, "performer")
}

func (m *PerformerEditProcessor) CreateJoin(input models.PerformerEditInput) error {
	if input.Edit.ID != nil {
		return m.queries.CreatePerformerEdit(m.context, db.CreatePerformerEditParams{
			EditID:      m.edit.ID,
			PerformerID: *input.Edit.ID,
		})
	}

	return nil
}

func (m *PerformerEditProcessor) apply() error {
	operation := m.operation()
	isCreate := operation == models.OperationEnumCreate

	var performer *models.Performer
	if !isCreate {
		performerID, err := m.queries.GetEditTargetID(m.context, m.edit.ID)
		if err != nil {
			return err
		}
		dbPerformer, err := m.queries.FindPerformer(m.context, performerID.ID)
		if err != nil {
			return fmt.Errorf("%w: performer, %s: %w", ErrEntityNotFound, performerID, err)
		}

		performer = converter.PerformerToModel(dbPerformer)
		performer.Updated = time.Now()
	}

	return m.applyEdit(performer)
}

func (m *PerformerEditProcessor) applyEdit(performer *models.Performer) error {
	data, err := m.edit.GetPerformerData()
	if err != nil {
		return err
	}

	operation := m.operation()

	switch operation {
	case models.OperationEnumCreate:
		return m.applyCreate(data)
	case models.OperationEnumDestroy:
		return m.applyDestroy(performer)
	case models.OperationEnumModify:
		return m.applyModify(performer, data)
	case models.OperationEnumMerge:
		return m.applyMerge(performer, data)
	}
	return nil
}

func (m *PerformerEditProcessor) applyCreate(data *models.PerformerEditData) error {
	now := time.Now()
	UUID := data.New.DraftID
	if UUID == nil {
		newUUID, err := uuid.NewV4()
		if err != nil {
			return err
		}
		UUID = &newUUID
	}
	newPerformer := &models.Performer{
		ID:      *UUID,
		Created: now,
		Updated: now,
	}

	if err := m.ApplyEdit(newPerformer, true, data); err != nil {
		return err
	}

	return m.queries.CreatePerformerEdit(m.context, db.CreatePerformerEditParams{
		EditID:      m.edit.ID,
		PerformerID: newPerformer.ID,
	})
}

func (m *PerformerEditProcessor) applyModify(performer *models.Performer, data *models.PerformerEditData) error {
	if err := performer.ValidateModifyEdit(*data); err != nil {
		return err
	}

	return m.ApplyEdit(performer, false, data)
}

func (m *PerformerEditProcessor) applyDestroy(performer *models.Performer) error {
	_, err := m.SoftDelete(*performer)
	if err != nil {
		return err
	}

	if err = m.queries.DeletePerformerScenes(m.context, performer.ID); err != nil {
		return err
	}
	return m.queries.DeletePerformerFavorites(m.context, performer.ID)
}

func (m *PerformerEditProcessor) applyMerge(performer *models.Performer, data *models.PerformerEditData) error {
	if err := m.applyModify(performer, data); err != nil {
		return err
	}

	for _, sourceID := range data.MergeSources {
		if err := m.mergeInto(sourceID, performer.ID, data.SetMergeAliases); err != nil {
			return err
		}
	}

	return nil
}

func (m *PerformerEditProcessor) mergeInto(sourceID uuid.UUID, targetID uuid.UUID, setAliases bool) error {
	dbPerformer, err := m.queries.FindPerformer(m.context, sourceID)
	if err != nil {
		return fmt.Errorf("%w: source performer, %s: %w", ErrEntityNotFound, sourceID.String(), err)
	}

	dbTarget, err := m.queries.FindPerformer(m.context, targetID)
	if err != nil {
		return fmt.Errorf("%w: target performer %s, %w", ErrEntityNotFound, targetID.String(), err)
	}

	performer := converter.PerformerToModel(dbPerformer)
	target := converter.PerformerToModel(dbTarget)
	return m.MergeInto(performer, target, setAliases)
}

func bodyModCompare(subject []*models.BodyModification, against []*models.BodyModification) (added []*models.BodyModification, missing []*models.BodyModification) {
	for _, s := range subject {
		newMod := true
		for _, a := range against {
			if s.Location == a.Location {
				newMod = (s.Description != nil && a.Description != nil && *s.Description != *a.Description) ||
					(s.Description == nil && a.Description != nil) ||
					(a.Description == nil && s.Description != nil)
			}
		}

		for _, a := range added {
			if s.Location == a.Location {
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
			if s.Location == a.Location {
				removedMod = (s.Description != nil && a.Description != nil && *s.Description != *a.Description) ||
					(s.Description == nil && a.Description != nil) ||
					(a.Description == nil && s.Description != nil)
			}
		}

		for _, a := range missing {
			if s.Location == a.Location {
				removedMod = false
			}
		}

		if removedMod {
			missing = append(missing, s)
		}
	}
	return
}

func (m *PerformerEditProcessor) diffRelationships(performerEdit *models.PerformerEditData, performerID uuid.UUID, input models.PerformerEditInput, inputArgs utils.ArgumentsQuery) error {
	if input.Details.Aliases != nil || inputArgs.Field("aliases").IsNull() {
		if err := m.diffAliases(performerEdit, performerID, input.Details.Aliases); err != nil {
			return err
		}
	}

	if input.Details.Tattoos != nil || inputArgs.Field("tattoos").IsNull() {
		if err := m.diffTattoos(performerEdit, performerID, converter.BodyModInputToModel(input.Details.Tattoos)); err != nil {
			return err
		}
	}

	if input.Details.Piercings != nil || inputArgs.Field("piercings").IsNull() {
		if err := m.diffPiercings(performerEdit, performerID, converter.BodyModInputToModel(input.Details.Piercings)); err != nil {
			return err
		}
	}

	if input.Details.Urls != nil || inputArgs.Field("urls").IsNull() {
		if err := m.diffURLs(performerEdit, performerID, input.Details.Urls); err != nil {
			return err
		}
	}

	if input.Details.ImageIds != nil || inputArgs.Field("image_ids").IsNull() {
		if err := m.diffImages(performerEdit, performerID, input.Details.ImageIds); err != nil {
			return err
		}
	}

	return nil
}

func (m *PerformerEditProcessor) diffAliases(performerEdit *models.PerformerEditData, performerID uuid.UUID, newAliases []string) error {
	aliases, err := m.queries.GetPerformerAliases(m.context, performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedAliases, performerEdit.New.RemovedAliases = utils.SliceCompare(newAliases, aliases)
	return nil
}

func (m *PerformerEditProcessor) diffTattoos(performerEdit *models.PerformerEditData, performerID uuid.UUID, newTattoos []*models.BodyModification) error {
	dbTattoos, err := m.queries.GetPerformerTattoos(m.context, performerID)
	if err != nil {
		return err
	}

	var tattoos []*models.BodyModification
	for _, mod := range dbTattoos {
		newMod := models.BodyModification{
			Description: mod.Description,
		}
		if mod.Location != nil {
			newMod.Location = *mod.Location
		}

		tattoos = append(tattoos, &newMod)
	}
	performerEdit.New.AddedTattoos, performerEdit.New.RemovedTattoos = bodyModCompare(newTattoos, tattoos)

	return nil
}

func (m *PerformerEditProcessor) diffPiercings(performerEdit *models.PerformerEditData, performerID uuid.UUID, newPiercings []*models.BodyModification) error {
	dbPiercings, err := m.queries.GetPerformerPiercings(m.context, performerID)
	if err != nil {
		return err
	}

	var piercings []*models.BodyModification
	for _, mod := range dbPiercings {
		newMod := models.BodyModification{
			Description: mod.Description,
		}
		if mod.Location != nil {
			newMod.Location = *mod.Location
		}

		piercings = append(piercings, &newMod)
	}
	performerEdit.New.AddedPiercings, performerEdit.New.RemovedPiercings = bodyModCompare(newPiercings, piercings)

	return nil
}

func (m *PerformerEditProcessor) diffURLs(performerEdit *models.PerformerEditData, performerID uuid.UUID, newURLs []*models.URLInput) error {
	dbUrls, err := m.queries.GetPerformerURLs(m.context, performerID)
	if err != nil {
		return err
	}

	var urls []*models.URL
	for _, url := range dbUrls {
		urls = append(urls, &models.URL{
			URL:    url.Url,
			SiteID: url.SiteID,
		})
	}
	performerEdit.New.AddedUrls, performerEdit.New.RemovedUrls = urlCompare(newURLs, urls)

	return nil
}

func (m *PerformerEditProcessor) diffImages(performerEdit *models.PerformerEditData, performerID uuid.UUID, newImages []uuid.UUID) error {
	images, err := m.queries.GetPerformerImages(m.context, performerID)
	if err != nil {
		return err
	}

	var existingImages []uuid.UUID
	for _, image := range images {
		existingImages = append(existingImages, image.ID)
	}
	performerEdit.New.AddedImages, performerEdit.New.RemovedImages = utils.SliceCompare(newImages, existingImages)

	return nil
}

func (m *PerformerEditProcessor) SoftDelete(performer models.Performer) (*models.Performer, error) {
	// Delete joins
	if err := m.queries.DeletePerformerAliases(m.context, performer.ID); err != nil {
		return nil, err
	}
	if err := m.queries.DeletePerformerPiercings(m.context, performer.ID); err != nil {
		return nil, err
	}
	if err := m.queries.DeletePerformerTattoos(m.context, performer.ID); err != nil {
		return nil, err
	}
	if err := m.queries.DeletePerformerURLs(m.context, performer.ID); err != nil {
		return nil, err
	}
	if err := m.queries.DeletePerformerImages(m.context, performer.ID); err != nil {
		return nil, err
	}

	ret, err := m.queries.SoftDeletePerformer(m.context, performer.ID)
	return converter.PerformerToModel(ret), err
}

func (m *PerformerEditProcessor) UpdateScenePerformers(oldPerformer *models.Performer, newTarget *models.Performer, setAliases bool) error {
	if setAliases {
		if err := m.UpdateScenePerformerAlias(oldPerformer.ID, oldPerformer.Name, newTarget.Name); err != nil {
			return err
		}
	}

	// Reassign scene performances to new performer, except if new performer is already assigned
	if err := m.queries.ReassignPerformerAliases(m.context, db.ReassignPerformerAliasesParams{
		OldPerformerID: oldPerformer.ID,
		NewPerformerID: newTarget.ID,
	}); err != nil {
		return err
	}

	// Delete leftover scene performances
	return m.queries.DeletePerformerScenes(m.context, oldPerformer.ID)
}

func (m *PerformerEditProcessor) reassignFavorites(oldPerformer *models.Performer, newTargetID uuid.UUID) error {
	if err := m.queries.ReassignPerformerFavorites(m.context, db.ReassignPerformerFavoritesParams{
		OldPerformerID: oldPerformer.ID,
		NewPerformerID: newTargetID,
	}); err != nil {
		return err
	}

	return m.queries.DeletePerformerFavorites(m.context, oldPerformer.ID)
}

func (m *PerformerEditProcessor) UpdateScenePerformerAlias(performerID uuid.UUID, oldName string, newName string) error {
	// Set old name as scene performance alias where one isn't already set
	if err := m.queries.SetScenePerformerAlias(m.context, db.SetScenePerformerAliasParams{
		PerformerID: performerID,
		As:          &oldName,
	}); err != nil {
		return err
	}

	// Remove alias from scene performances where the alias matches new name
	return m.queries.ClearScenePerformerAlias(m.context, db.ClearScenePerformerAliasParams{
		PerformerID: performerID,
		As:          &newName,
	})
}

func (m *PerformerEditProcessor) MergeInto(source *models.Performer, target *models.Performer, setAliases bool) error {
	if source.Deleted {
		return fmt.Errorf("merge source performer is deleted: %s", source.ID.String())
	}
	if target.Deleted {
		return fmt.Errorf("merge target performer is deleted: %s", target.ID.String())
	}

	if _, err := m.SoftDelete(*source); err != nil {
		return err
	}

	if err := m.queries.UpdatePerformerRedirects(m.context, db.UpdatePerformerRedirectsParams{
		OldPerformerID: source.ID,
		NewPerformerID: target.ID,
	}); err != nil {
		return err
	}
	if err := m.UpdateScenePerformers(source, target, setAliases); err != nil {
		return err
	}
	if err := m.reassignFavorites(source, target.ID); err != nil {
		return err
	}

	return m.queries.CreatePerformerRedirect(m.context, db.CreatePerformerRedirectParams{
		SourceID: source.ID,
		TargetID: target.ID,
	})
}

func (m *PerformerEditProcessor) ApplyEdit(performer *models.Performer, create bool, data *models.PerformerEditData) error {
	old := data.Old
	if old == nil {
		old = &models.PerformerEdit{}
	}
	performer.CopyFromPerformerEdit(*data.New, *old)

	var err error
	if create {
		_, err = m.queries.CreatePerformer(m.context, converter.PerformerToCreateParams(*performer))
	} else {
		_, err = m.queries.UpdatePerformer(m.context, converter.PerformerToUpdateParams(*performer))
	}
	if err != nil {
		return err
	}

	if err := m.updateAliasesFromEdit(performer.ID, data); err != nil {
		return err
	}

	if err := m.updateTattoosFromEdit(performer.ID, data); err != nil {
		return err
	}

	if err := m.updatePiercingsFromEdit(performer.ID, data); err != nil {
		return err
	}

	if err := m.updateURLsFromEdit(performer.ID, data); err != nil {
		return err
	}

	if err := m.updateImagesFromEdit(performer.ID, data); err != nil {
		return err
	}

	if data.New.Name != nil && data.SetModifyAliases {
		if err = m.UpdateScenePerformerAlias(performer.ID, *data.Old.Name, *data.New.Name); err != nil {
			return err
		}
	}

	return err
}

func (m *PerformerEditProcessor) updateAliasesFromEdit(performerID uuid.UUID, data *models.PerformerEditData) error {
	aliases, err := m.queries.GetEditPerformerAliases(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeletePerformerAliases(m.context, performerID); err != nil {
		return err
	}

	var aliasParam []db.CreatePerformerAliasesParams
	for _, alias := range aliases {
		aliasParam = append(aliasParam, db.CreatePerformerAliasesParams{
			Alias:       alias,
			PerformerID: performerID,
		})
	}
	_, err = m.queries.CreatePerformerAliases(m.context, aliasParam)
	return err
}

func (m *PerformerEditProcessor) updateTattoosFromEdit(performerID uuid.UUID, data *models.PerformerEditData) error {
	tattoos, err := m.queries.GetEditPerformerTattoos(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeletePerformerTattoos(m.context, performerID); err != nil {
		return err
	}

	if len(tattoos) == 0 {
		return nil
	}

	var tattooParams []db.CreatePerformerTattoosParams
	for _, tattoo := range tattoos {
		tattooParams = append(tattooParams, db.CreatePerformerTattoosParams{
			PerformerID: performerID,
			Location:    tattoo.Location,
			Description: tattoo.Description,
		})
	}

	_, err = m.queries.CreatePerformerTattoos(m.context, tattooParams)
	return err
}

func (m *PerformerEditProcessor) updatePiercingsFromEdit(performerID uuid.UUID, data *models.PerformerEditData) error {
	piercings, err := m.queries.GetEditPerformerPiercings(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeletePerformerPiercings(m.context, performerID); err != nil {
		return err
	}

	if len(piercings) == 0 {
		return nil
	}

	var piercingParams []db.CreatePerformerPiercingsParams
	for _, piercing := range piercings {
		piercingParams = append(piercingParams, db.CreatePerformerPiercingsParams{
			PerformerID: performerID,
			Location:    piercing.Location,
			Description: piercing.Description,
		})
	}

	_, err = m.queries.CreatePerformerPiercings(m.context, piercingParams)
	return err
}

func (m *PerformerEditProcessor) updateURLsFromEdit(performerID uuid.UUID, data *models.PerformerEditData) error {
	urls, err := m.queries.GetMergedURLsForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeletePerformerURLs(m.context, performerID); err != nil {
		return err
	}

	var urlsParams []db.CreatePerformerURLsParams
	for _, url := range urls {
		urlsParams = append(urlsParams, db.CreatePerformerURLsParams{
			PerformerID: performerID,
			Url:         url.Url,
			SiteID:      url.SiteID,
		})
	}

	_, err = m.queries.CreatePerformerURLs(m.context, urlsParams)
	return err
}

func (m *PerformerEditProcessor) updateImagesFromEdit(performerID uuid.UUID, data *models.PerformerEditData) error {
	dbImages, err := m.queries.GetImagesForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeletePerformerImages(m.context, performerID); err != nil {
		return err
	}

	var images []db.CreatePerformerImagesParams
	for _, image := range dbImages {
		images = append(images, db.CreatePerformerImagesParams{
			ImageID:     image.ID,
			PerformerID: performerID,
		})
	}

	_, err = m.queries.CreatePerformerImages(m.context, images)
	return err
}
