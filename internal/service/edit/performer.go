package edit

import (
	"context"
	"fmt"
	"reflect"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/imagetype"
	"github.com/stashapp/stash-box/pkg/utils"
)

type PerformerEditProcessor struct {
	mutator
}

func Performer(ctx context.Context, queries *queries.Queries, edit *models.Edit) *PerformerEditProcessor {
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
	var entity editEntity = performer
	if err := validateEditEntity(&entity, *input.Edit.ID, "performer"); err != nil {
		return err
	}

	// perform a diff against the input and the current object
	detailArgs := inputArgs.Field("details")
	performerEdit, err := input.Details.PerformerEditFromDiff(performer, detailArgs)
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
	performerEdit, err := input.Details.PerformerEditFromMerge(performer, mergeSources, detailArgs)
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
	performerEdit.New.AddedUrls = input.Details.Urls
	performerEdit.New.DraftID = input.Details.DraftID

	for _, entry := range input.Details.ImageTypes {
		for _, imageType := range entry.Types {
			performerEdit.New.AddedImageTypes = append(performerEdit.New.AddedImageTypes, models.ImageTypeAssignment{
				ImageID: entry.ImageID,
				Type:    imageType,
			})
		}

		if entry.Date != nil {
			performerEdit.New.ImageDates = append(performerEdit.New.ImageDates, models.ImageDate{
				ImageID: entry.ImageID,
				Date:    entry.Date,
			})
		}
	}

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
	var entity editEntity = performer
	return validateEditEntity(&entity, performerID, "performer")
}

func (m *PerformerEditProcessor) CreateJoin(input models.PerformerEditInput) error {
	if input.Edit.ID != nil {
		return m.queries.CreatePerformerEdit(m.context, queries.CreatePerformerEditParams{
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

		performer = converter.PerformerToModelPtr(dbPerformer)
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
	UUID := data.New.DraftID
	if UUID == nil {
		newUUID, err := uuid.NewV7()
		if err != nil {
			return err
		}
		UUID = &newUUID
	}
	newPerformer := &models.Performer{
		ID: *UUID,
	}

	if err := m.ApplyEdit(newPerformer, true, data); err != nil {
		return err
	}

	return m.queries.CreatePerformerEdit(m.context, queries.CreatePerformerEditParams{
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

	performer := converter.PerformerToModelPtr(dbPerformer)
	target := converter.PerformerToModelPtr(dbTarget)
	return m.MergeInto(performer, target, setAliases)
}

func bodyModCompare(subject []models.BodyModification, against []models.BodyModification) (added []models.BodyModification, missing []models.BodyModification) {
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

	if input.Details.ImageTypes != nil || inputArgs.Field("image_types").IsNull() {
		if err := m.diffImageTypes(performerEdit, performerID, input.Details.ImageTypes); err != nil {
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

func (m *PerformerEditProcessor) diffTattoos(performerEdit *models.PerformerEditData, performerID uuid.UUID, newTattoos []models.BodyModification) error {
	dbTattoos, err := m.queries.GetPerformerTattoos(m.context, performerID)
	if err != nil {
		return err
	}

	var tattoos []models.BodyModification
	for _, mod := range dbTattoos {
		newMod := models.BodyModification{
			Description: mod.Description,
		}
		if mod.Location != nil {
			newMod.Location = *mod.Location
		}

		tattoos = append(tattoos, newMod)
	}
	performerEdit.New.AddedTattoos, performerEdit.New.RemovedTattoos = bodyModCompare(newTattoos, tattoos)

	return nil
}

func (m *PerformerEditProcessor) diffPiercings(performerEdit *models.PerformerEditData, performerID uuid.UUID, newPiercings []models.BodyModification) error {
	dbPiercings, err := m.queries.GetPerformerPiercings(m.context, performerID)
	if err != nil {
		return err
	}

	var piercings []models.BodyModification
	for _, mod := range dbPiercings {
		newMod := models.BodyModification{
			Description: mod.Description,
		}
		if mod.Location != nil {
			newMod.Location = *mod.Location
		}

		piercings = append(piercings, newMod)
	}
	performerEdit.New.AddedPiercings, performerEdit.New.RemovedPiercings = bodyModCompare(newPiercings, piercings)

	return nil
}

func (m *PerformerEditProcessor) diffURLs(performerEdit *models.PerformerEditData, performerID uuid.UUID, newURLs []models.URL) error {
	dbUrls, err := m.queries.GetPerformerURLs(m.context, performerID)
	if err != nil {
		return err
	}

	var urls []models.URL
	for _, url := range dbUrls {
		urls = append(urls, models.URL{
			URL:    url.Url,
			SiteID: url.SiteID,
		})
	}
	performerEdit.New.AddedUrls, performerEdit.New.RemovedUrls = utils.SliceCompare(newURLs, urls)

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

// diffImageTypes is the tuple analogue of diffImages, over (image_id, type)
// rather than a bare image id: retagging is one removed tuple plus one added
// tuple, which is genuinely what happened
//
// This is the edit path's half of the table on ImageAssignmentInput in
// graphql/schema/types/image_type.graphql, which is where the whole contract
// is written down. The direct path implements the same table in
// performer/joins.go's resolveAssignments, and nothing makes the two agree
// except that table.
//
// Called only when the caller stated the field: see the IsNull check at the
// call site, which is what lets this path treat an explicit null as "clear"
// where the direct path cannot
func (m *PerformerEditProcessor) diffImageTypes(performerEdit *models.PerformerEditData, performerID uuid.UUID, submitted []models.ImageAssignmentInput) error {
	rows, err := m.queries.FindImageTypesByPerformerIds(m.context, []uuid.UUID{performerID})
	if err != nil {
		return err
	}

	named := make(map[uuid.UUID]struct{}, len(submitted))
	var newAssignments []models.ImageTypeAssignment
	for _, entry := range submitted {
		named[entry.ImageID] = struct{}{}
		for _, imageType := range entry.Types {
			newAssignments = append(newAssignments, models.ImageTypeAssignment{
				ImageID: entry.ImageID,
				Type:    imageType,
			})
		}
	}

	var current []models.ImageTypeAssignment
	for _, row := range rows {
		// A non-empty list is authoritative only over the images it names, so
		// an image left out of it must not enter the diff at all or it would
		// be stripped.
		// null and the empty list name nothing and clear everything, matching how image_ids behaves
		if len(submitted) > 0 {
			if _, mentioned := named[row.ImageID]; !mentioned {
				continue
			}
		}

		current = append(current, models.ImageTypeAssignment{
			ImageID: row.ImageID,
			Type:    models.ImageTypeEnum(row.TypeKey),
		})
	}

	performerEdit.New.AddedImageTypes, performerEdit.New.RemovedImageTypes = utils.SliceCompare(newAssignments, current)

	return m.diffImageDates(performerEdit, performerID, submitted)
}

// diffImageDates records only the dates the edit changes. A date is
// single-valued, so this is an override list rather than added/removed tuples,
// and an image the submission does not name is simply absent from it
func (m *PerformerEditProcessor) diffImageDates(performerEdit *models.PerformerEditData, performerID uuid.UUID, submitted []models.ImageAssignmentInput) error {
	rows, err := m.queries.FindImageDatesByPerformerIds(m.context, []uuid.UUID{performerID})
	if err != nil {
		return err
	}

	currentDates := make(map[uuid.UUID]*string, len(rows))
	for _, row := range rows {
		currentDates[row.ImageID] = row.Date
	}

	var changed []models.ImageDate
	for _, entry := range submitted {
		current := currentDates[entry.ImageID]
		if ptrEqual(current, entry.Date) {
			continue
		}

		changed = append(changed, models.ImageDate{
			ImageID: entry.ImageID,
			Date:    entry.Date,
		})
	}

	performerEdit.New.ImageDates = changed

	return nil
}

func ptrEqual(a, b *string) bool {
	if a == nil || b == nil {
		return a == b
	}
	return *a == *b
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
	return converter.PerformerToModelPtr(ret), err
}

func (m *PerformerEditProcessor) UpdateScenePerformers(oldPerformer *models.Performer, newTarget *models.Performer, setAliases bool) error {
	if setAliases {
		if err := m.UpdateScenePerformerAlias(oldPerformer.ID, oldPerformer.Name, newTarget.Name); err != nil {
			return err
		}
	}

	// Reassign scene performances to new performer, except if new performer is already assigned
	if err := m.queries.ReassignPerformerAliases(m.context, queries.ReassignPerformerAliasesParams{
		OldPerformerID: oldPerformer.ID,
		NewPerformerID: newTarget.ID,
	}); err != nil {
		return err
	}

	// Delete leftover scene performances
	return m.queries.DeletePerformerScenes(m.context, oldPerformer.ID)
}

func (m *PerformerEditProcessor) reassignFavorites(oldPerformer *models.Performer, newTargetID uuid.UUID) error {
	if err := m.queries.ReassignPerformerFavorites(m.context, queries.ReassignPerformerFavoritesParams{
		OldPerformerID: oldPerformer.ID,
		NewPerformerID: newTargetID,
	}); err != nil {
		return err
	}

	return m.queries.DeletePerformerFavorites(m.context, oldPerformer.ID)
}

func (m *PerformerEditProcessor) UpdateScenePerformerAlias(performerID uuid.UUID, oldName string, newName string) error {
	// Set old name as scene performance alias where one isn't already set
	if err := m.queries.SetScenePerformerAlias(m.context, queries.SetScenePerformerAliasParams{
		PerformerID: performerID,
		As:          &oldName,
	}); err != nil {
		return err
	}

	// Remove alias from scene performances where the alias matches new name
	return m.queries.ClearScenePerformerAlias(m.context, queries.ClearScenePerformerAliasParams{
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

	if err := m.queries.UpdatePerformerRedirects(m.context, queries.UpdatePerformerRedirectsParams{
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

	return m.queries.CreatePerformerRedirect(m.context, queries.CreatePerformerRedirectParams{
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

	var aliasParam []queries.CreatePerformerAliasesParams
	for _, alias := range aliases {
		aliasParam = append(aliasParam, queries.CreatePerformerAliasesParams{
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

	var tattooParams []queries.CreatePerformerTattoosParams
	for _, tattoo := range tattoos {
		tattooParams = append(tattooParams, queries.CreatePerformerTattoosParams{
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

	var piercingParams []queries.CreatePerformerPiercingsParams
	for _, piercing := range piercings {
		piercingParams = append(piercingParams, queries.CreatePerformerPiercingsParams{
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

	var urlsParams []queries.CreatePerformerURLsParams
	for _, url := range urls {
		urlsParams = append(urlsParams, queries.CreatePerformerURLsParams{
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

	// Resolved before the delete below, which cascades the assignments away
	// through performer_image_types' composite foreign key. Reading after it
	// would resolve against an emptied table and quietly drop every label,
	// including on edits that never mention images
	dbTypes, err := m.queries.GetImageTypesForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	// Dates are a column on the rows about to be deleted, so unlike the
	// assignments they are not merely cascaded but truncated: anything not
	// written back below is gone. Resolved before the delete for the same
	// reason the assignments are
	dbDates, err := m.queries.GetImageDatesForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	dates := make(map[uuid.UUID]*string, len(dbDates))
	for _, dbDate := range dbDates {
		dates[dbDate.ImageID] = dbDate.Date
	}

	if err := m.queries.DeletePerformerImages(m.context, performerID); err != nil {
		return err
	}

	var images []queries.CreatePerformerImagesParams
	for _, image := range dbImages {
		images = append(images, queries.CreatePerformerImagesParams{
			ImageID:     image.ID,
			PerformerID: performerID,
			Date:        dates[image.ID],
		})
	}

	if _, err := m.queries.CreatePerformerImages(m.context, images); err != nil {
		return err
	}

	if err := imagetype.ValidateCombinations(m.context, m.queries, mergedAssignments(dbTypes)); err != nil {
		return err
	}

	// After the join rows, which the composite foreign key requires to exist.
	var imageTypes []queries.CreatePerformerImageTypesParams
	for _, dbType := range dbTypes {
		imageTypes = append(imageTypes, queries.CreatePerformerImageTypesParams{
			PerformerID: performerID,
			ImageID:     dbType.ImageID,
			TypeKey:     dbType.TypeKey,
		})
	}

	_, err = m.queries.CreatePerformerImageTypes(m.context, imageTypes)
	return err
}

// mergedAssignments regroups the resolved tuples into one entry per image,
// which is the shape the validator reasons in: the rules are about what a
// single image ends up carrying
func mergedAssignments(dbTypes []queries.GetImageTypesForEditRow) []models.ImageAssignmentInput {
	byImage := make(map[uuid.UUID][]models.ImageTypeEnum)
	order := make([]uuid.UUID, 0, len(dbTypes))

	for _, dbType := range dbTypes {
		if _, seen := byImage[dbType.ImageID]; !seen {
			order = append(order, dbType.ImageID)
		}
		byImage[dbType.ImageID] = append(byImage[dbType.ImageID], models.ImageTypeEnum(dbType.TypeKey))
	}

	assignments := make([]models.ImageAssignmentInput, 0, len(order))
	for _, imageID := range order {
		assignments = append(assignments, models.ImageAssignmentInput{
			ImageID: imageID,
			Types:   byImage[imageID],
		})
	}

	return assignments
}
