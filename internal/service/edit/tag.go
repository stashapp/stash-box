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

type TagEditProcessor struct {
	mutator
}

func Tag(ctx context.Context, queries *queries.Queries, edit *models.Edit) *TagEditProcessor {
	return &TagEditProcessor{
		mutator{
			context: ctx,
			queries: queries,
			edit:    edit,
		},
	}
}

func (m *TagEditProcessor) Edit(input models.TagEditInput, inputArgs utils.ArgumentsQuery) error {
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

func (m *TagEditProcessor) modifyEdit(input models.TagEditInput, inputArgs utils.ArgumentsQuery) error {
	// get the existing tag
	tagID := *input.Edit.ID
	dbTag, err := m.queries.FindTag(m.context, tagID)

	if err != nil {
		return err
	}

	tag := converter.TagToModel(dbTag)
	var entity editEntity = tag
	if err := validateEditEntity(&entity, tagID, "tag"); err != nil {
		return err
	}

	// perform a diff against the input and the current object
	detailArgs := inputArgs.Field("details")
	tagEdit := input.Details.TagEditFromDiff(tag, detailArgs)

	aliases, err := m.queries.GetTagAliases(m.context, tagID)
	if err != nil {
		return err
	}

	if input.Details.Aliases != nil || inputArgs.Field("aliases").IsNull() {
		tagEdit.New.AddedAliases, tagEdit.New.RemovedAliases = utils.SliceCompare(input.Details.Aliases, aliases)
	}

	if reflect.DeepEqual(tagEdit.Old, tagEdit.New) {
		return ErrNoChanges
	}

	return m.edit.SetData(tagEdit)
}

func (m *TagEditProcessor) mergeEdit(input models.TagEditInput, inputArgs utils.ArgumentsQuery) error {
	// get the existing tag
	if input.Edit.ID == nil {
		return ErrMergeIDMissing
	}
	tagID := *input.Edit.ID
	dbTag, err := m.queries.FindTag(m.context, tagID)

	if err != nil {
		return fmt.Errorf("%w: target tag %s: %w", ErrEntityNotFound, tagID.String(), err)
	}

	tag := converter.TagToModel(dbTag)
	var mergeSources []uuid.UUID
	for _, sourceID := range input.Edit.MergeSourceIds {
		if tagID == sourceID {
			return ErrMergeTargetIsSource
		}

		_, err := m.queries.FindTag(m.context, tagID)
		if err != nil {
			return fmt.Errorf("%w: source tag %s: %w", ErrEntityNotFound, sourceID.String(), err)
		}

		mergeSources = append(mergeSources, sourceID)
	}

	if len(mergeSources) < 1 {
		return ErrNoMergeSources
	}

	// perform a diff against the input and the current object
	detailArgs := inputArgs.Field("details")
	tagEdit := input.Details.TagEditFromMerge(tag, mergeSources, detailArgs)

	aliases, err := m.queries.GetTagAliases(m.context, tagID)

	if err != nil {
		return err
	}

	tagEdit.New.AddedAliases, tagEdit.New.RemovedAliases = utils.SliceCompare(input.Details.Aliases, aliases)

	return m.edit.SetData(tagEdit)
}

func (m *TagEditProcessor) createEdit(input models.TagEditInput, inputArgs utils.ArgumentsQuery) error {
	tagEdit := input.Details.TagEditFromCreate(inputArgs)

	tagEdit.New.AddedAliases = input.Details.Aliases

	return m.edit.SetData(tagEdit)
}

func (m *TagEditProcessor) destroyEdit(input models.TagEditInput) error {
	// Get the existing tag
	tagID := *input.Edit.ID
	dbTag, err := m.queries.FindTag(m.context, tagID)

	if err != nil {
		return err
	}

	tag := converter.TagToModel(dbTag)
	var entity editEntity = tag
	return validateEditEntity(&entity, tagID, "tag")
}

func (m *TagEditProcessor) CreateJoin(input models.TagEditInput) error {
	if input.Edit.ID != nil {
		return m.queries.CreateTagEdit(m.context, queries.CreateTagEditParams{
			EditID: m.edit.ID,
			TagID:  *input.Edit.ID,
		})
	}

	return nil
}

func (m *TagEditProcessor) updateAliasesFromEdit(tag *models.Tag, data *models.TagEditData) error {
	aliases, err := m.queries.GetMergedTagAliasesForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteTagAliases(m.context, tag.ID); err != nil {
		return err
	}

	var params []queries.CreateTagAliasesParams
	for _, alias := range aliases {
		params = append(params, queries.CreateTagAliasesParams{
			TagID: tag.ID,
			Alias: alias,
		})
	}
	_, err = m.queries.CreateTagAliases(m.context, params)
	return err
}

func (m *TagEditProcessor) apply() error {
	operation := m.operation()
	isCreate := operation == models.OperationEnumCreate

	var tag *models.Tag
	if !isCreate {
		res, err := m.queries.GetEditTargetID(m.context, m.edit.ID)
		if err != nil {
			return err
		}
		dbTag, err := m.queries.FindTag(m.context, res.ID)
		if err != nil {
			return fmt.Errorf("%w: tag %s", ErrEntityNotFound, res.ID.String())
		}
		tag = converter.TagToModelPtr(dbTag)
	}

	data, err := m.edit.GetTagData()
	if err != nil {
		return err
	}

	switch operation {
	case models.OperationEnumCreate:
		UUID, err := uuid.NewV7()
		if err != nil {
			return err
		}
		newTag := models.Tag{
			ID: UUID,
		}
		if data.New.Name == nil {
			return errors.New("missing tag name")
		}
		newTag.CopyFromTagEdit(*data.New, &models.TagEdit{})

		_, err = m.queries.CreateTag(m.context, converter.TagToCreateParams(newTag))
		if err != nil {
			return err
		}

		if len(data.New.AddedAliases) > 0 {
			var params []queries.CreateTagAliasesParams
			for _, alias := range data.New.AddedAliases {
				params = append(params, queries.CreateTagAliasesParams{
					TagID: newTag.ID,
					Alias: alias,
				})
			}
			_, err := m.queries.CreateTagAliases(m.context, params)
			if err != nil {
				return err
			}
		}

		return m.queries.CreateTagEdit(m.context, queries.CreateTagEditParams{
			EditID: m.edit.ID,
			TagID:  newTag.ID,
		})

	case models.OperationEnumDestroy:
		_, err := m.queries.SoftDeleteTag(m.context, tag.ID)
		if err != nil {
			return err
		}
		// TODO: Not cascading?
		err = m.queries.DeleteSceneTagsByTag(m.context, tag.ID)
		if err != nil {
			return err
		}
	case models.OperationEnumModify:
		if err := tag.ValidateModifyEdit(*data); err != nil {
			return err
		}

		tag.CopyFromTagEdit(*data.New, data.Old)
		_, err = m.queries.UpdateTag(m.context, converter.TagToUpdateParams(*tag))
		if err != nil {
			return err
		}

		return m.updateAliasesFromEdit(tag, data)
	case models.OperationEnumMerge:
		if err := tag.ValidateModifyEdit(*data); err != nil {
			return err
		}

		tag.CopyFromTagEdit(*data.New, data.Old)
		_, err = m.queries.UpdateTag(m.context, converter.TagToUpdateParams(*tag))
		if err != nil {
			return err
		}

		for _, sourceID := range data.MergeSources {
			if err := m.mergeInto(sourceID, tag.ID); err != nil {
				return err
			}
		}

		return m.updateAliasesFromEdit(tag, data)
	default:
		return errors.New("Unsupported operation: " + operation.String())
	}

	return nil
}

func (m *TagEditProcessor) mergeInto(sourceID uuid.UUID, targetID uuid.UUID) error {
	tag, err := m.queries.FindTag(m.context, sourceID)
	if err != nil {
		return fmt.Errorf("merge source tag not found, %v: %v"+sourceID.String(), err)
	}
	if tag.Deleted {
		return errors.New("merge source tag is deleted, %v" + sourceID.String())
	}
	_, err = m.queries.SoftDeleteTag(m.context, sourceID)
	if err != nil {
		return err
	}
	if err = m.queries.UpdateTagRedirects(m.context, queries.UpdateTagRedirectsParams{
		OldTargetID: sourceID,
		NewTargetID: targetID,
	}); err != nil {
		return err
	}

	if err = m.queries.UpdateSceneTagsForMerge(m.context, queries.UpdateSceneTagsForMergeParams{
		OldTagID: sourceID,
		NewTagID: targetID,
	}); err != nil {
		return err
	}

	// Delete any remaining old tags (these are scenes that already had the target tag)
	if err = m.queries.DeleteSceneTagsByTag(m.context, sourceID); err != nil {
		return err
	}

	return m.queries.CreateTagRedirect(m.context, queries.CreateTagRedirectParams{
		SourceID: sourceID,
		TargetID: targetID,
	})
}
