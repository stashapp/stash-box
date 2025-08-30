//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"gotest.tools/v3/assert"
)

type tagEditTestRunner struct {
	testRunner
}

func createTagEditTestRunner(t *testing.T) *tagEditTestRunner {
	return &tagEditTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *tagEditTestRunner) testCreateTagEdit() {
	category, err := s.createTestTagCategory(nil)
	assert.NilError(s.t, err)

	categoryID := category.ID
	name := "Name"
	description := "Description"
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name:        &name,
		Description: &description,
		Aliases:     []string{"Alias1"},
		CategoryID:  &categoryID,
	}

	edit, err := s.createTestTagEdit(models.OperationEnumCreate, &tagEditDetailsInput, nil)
	assert.NilError(s.t, err)
	s.verifyCreatedTagEdit(tagEditDetailsInput, edit)
}

func (s *tagEditTestRunner) verifyCreatedTagEdit(input models.TagEditDetailsInput, edit *models.Edit) {
	r := s.resolver.Edit()

	assert.Assert(s.t, edit.ID != uuid.Nil, "Expected created edit id to be non-zero")

	details, _ := r.Details(s.ctx, edit)
	tagDetails := details.(*models.TagEdit)

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, *tagDetails.Name)
	assert.Equal(s.t, *input.Description, *tagDetails.Description)
	assert.DeepEqual(s.t, input.Aliases, tagDetails.AddedAliases)
	assert.Equal(s.t, *input.CategoryID, *tagDetails.CategoryID)
}

func (s *tagEditTestRunner) testFindEditById() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NilError(s.t, err)

	edit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NilError(s.t, err, "Error finding edit")

	// ensure returned tag is not nil
	assert.Assert(s.t, edit != nil, "Did not find edit by id")
}

func (s *tagEditTestRunner) testModifyTagEdit() {
	existingCategory, err := s.createTestTagCategory(nil)
	assert.NilError(s.t, err)

	existingCategoryID := existingCategory.ID
	existingName := "tagName"
	existingAlias := "tagAlias"
	tagCreateInput := models.TagCreateInput{
		Name:       existingName,
		Aliases:    []string{existingAlias},
		CategoryID: &existingCategoryID,
	}
	createdTag, err := s.createTestTag(&tagCreateInput)
	assert.NilError(s.t, err)

	newCategory, err := s.createTestTagCategory(nil)
	assert.NilError(s.t, err)

	newCategoryID := newCategory.ID
	newDescription := "newDescription"
	newAlias := "newTagAlias"
	newName := "newName"
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name:        &newName,
		Description: &newDescription,
		Aliases:     []string{newAlias},
		CategoryID:  &newCategoryID,
	}
	id := createdTag.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestTagEdit(models.OperationEnumModify, &tagEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	s.verifyUpdatedTagEdit(createdTag, tagEditDetailsInput, createdUpdateEdit)
}

func (s *tagEditTestRunner) verifyUpdatedTagEdit(originalTag *tagOutput, input models.TagEditDetailsInput, edit *models.Edit) {
	tagDetails := s.getEditTagDetails(edit)

	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, *tagDetails.Name)
	assert.Equal(s.t, *input.Description, *tagDetails.Description)

	tagAliases := originalTag.Aliases
	assert.DeepEqual(s.t, tagAliases, tagDetails.RemovedAliases)
	assert.DeepEqual(s.t, input.Aliases, tagDetails.AddedAliases)

	assert.Equal(s.t, *input.CategoryID, *tagDetails.CategoryID)
}

func (s *tagEditTestRunner) testDestroyTagEdit() {
	createdTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	tagID := createdTag.UUID()

	tagEditDetailsInput := models.TagEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &tagID,
	}
	destroyEdit, err := s.createTestTagEdit(models.OperationEnumDestroy, &tagEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	s.verifyDestroyTagEdit(tagID, destroyEdit)
}

func (s *tagEditTestRunner) verifyDestroyTagEdit(tagID uuid.UUID, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)

	editTarget := s.getEditTagTarget(edit)

	assert.Equal(s.t, tagID, editTarget.ID)
}

func (s *tagEditTestRunner) testMergeTagEdit() {
	existingName := "tagName2"
	existingAlias := "tagAlias2"
	tagCreateInput := models.TagCreateInput{
		Name:    existingName,
		Aliases: []string{existingAlias},
	}
	createdPrimaryTag, err := s.createTestTag(&tagCreateInput)
	assert.NilError(s.t, err)

	createdMergeTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	newDescription := "newDescription2"
	newAlias := "newTagAlias2"
	newName := "newName2"
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name:        &newName,
		Description: &newDescription,
		Aliases:     []string{newAlias},
	}
	id := createdPrimaryTag.UUID()
	mergeSources := []uuid.UUID{createdMergeTag.UUID()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	createdMergeEdit, err := s.createTestTagEdit(models.OperationEnumMerge, &tagEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	s.verifyMergeTagEdit(createdPrimaryTag, tagEditDetailsInput, createdMergeEdit, mergeSources)
}

func (s *tagEditTestRunner) verifyMergeTagEdit(originalTag *tagOutput, input models.TagEditDetailsInput, edit *models.Edit, inputMergeSources []uuid.UUID) {
	tagDetails := s.getEditTagDetails(edit)

	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, *tagDetails.Name)
	assert.Equal(s.t, *input.Description, *tagDetails.Description)

	tagAliases := originalTag.Aliases
	assert.DeepEqual(s.t, tagAliases, tagDetails.RemovedAliases)
	assert.DeepEqual(s.t, input.Aliases, tagDetails.AddedAliases)

	var mergeSources []uuid.UUID
	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		merge := merges[i].(*models.Tag)
		mergeSources = append(mergeSources, merge.ID)
	}
	assert.DeepEqual(s.t, inputMergeSources, mergeSources)
}

func (s *tagEditTestRunner) testApplyCreateTagEdit() {
	name := "Name"
	description := "Description"
	category, err := s.createTestTagCategory(nil)
	assert.NilError(s.t, err)

	categoryID := category.ID
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name:        &name,
		Description: &description,
		Aliases:     []string{"Alias1"},
		CategoryID:  &categoryID,
	}
	edit, err := s.createTestTagEdit(models.OperationEnumCreate, &tagEditDetailsInput, nil)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(edit.ID)
	assert.NilError(s.t, err)

	s.verifyAppliedTagCreateEdit(tagEditDetailsInput, appliedEdit)
}

func (s *tagEditTestRunner) verifyAppliedTagCreateEdit(input models.TagEditDetailsInput, edit *models.Edit) {
	assert.Assert(s.t, edit.ID != uuid.Nil, "Expected created edit id to be non-zero")

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(true, edit)

	tag := s.getEditTagTarget(edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, tag.Name)
	assert.Equal(s.t, *input.Description, *tag.Description)

	aliases, err := s.resolver.Tag().Aliases(s.ctx, tag)
	assert.NilError(s.t, err)
	assert.DeepEqual(s.t, input.Aliases, aliases)

	assert.Equal(s.t, *input.CategoryID, tag.CategoryID.UUID)
}

func (s *tagEditTestRunner) testApplyModifyTagEdit() {
	existingName := "tagName3"
	existingAlias := "tagAlias3"
	tagCreateInput := models.TagCreateInput{
		Name:    existingName,
		Aliases: []string{existingAlias},
	}
	createdTag, err := s.createTestTag(&tagCreateInput)
	assert.NilError(s.t, err)

	newDescription := "newDescription3"
	newAlias := "newTagAlias3"
	newName := "newName3"
	newCategory, err := s.createTestTagCategory(nil)
	assert.NilError(s.t, err)

	newCategoryID := newCategory.ID
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name:        &newName,
		Description: &newDescription,
		Aliases:     []string{newAlias},
		CategoryID:  &newCategoryID,
	}
	id := createdTag.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestTagEdit(models.OperationEnumModify, &tagEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID)
	assert.NilError(s.t, err)

	modifiedTag, err := s.resolver.Query().FindTag(s.ctx, &id, nil)
	assert.NilError(s.t, err)
	s.verifyApplyModifyTagEdit(tagEditDetailsInput, modifiedTag, appliedEdit)
}

func (s *tagEditTestRunner) verifyApplyModifyTagEdit(input models.TagEditDetailsInput, updatedTag *models.Tag, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(true, edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, updatedTag.Name)
	assert.Equal(s.t, *input.Description, *updatedTag.Description)

	tagAliases, _ := s.resolver.Tag().Aliases(s.ctx, updatedTag)
	assert.DeepEqual(s.t, input.Aliases, tagAliases)

	assert.Assert(s.t, updatedTag.CategoryID.Valid && (*input.CategoryID == updatedTag.CategoryID.UUID))
}

func (s *tagEditTestRunner) testApplyDestroyTagEdit() {
	createdTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	tagID := createdTag.UUID()
	sceneInput := models.SceneCreateInput{
		TagIds: []uuid.UUID{tagID},
		Date:   "2020-03-02",
	}
	scene, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	tagEditDetailsInput := models.TagEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &tagID,
	}
	destroyEdit, err := s.createTestTagEdit(models.OperationEnumDestroy, &tagEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(destroyEdit.ID)
	assert.NilError(s.t, err)

	destroyedTag, err := s.resolver.Query().FindTag(s.ctx, &tagID, nil)
	assert.NilError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NilError(s.t, err, "Error finding scene")
	s.verifyApplyDestroyTagEdit(destroyedTag, appliedEdit, scene)
}

func (s *tagEditTestRunner) verifyApplyDestroyTagEdit(destroyedTag *models.Tag, edit *models.Edit, scene *sceneOutput) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(true, edit)

	assert.Equal(s.t, destroyedTag.Deleted, true)

	sceneTags := scene.Tags
	assert.Assert(s.t, len(sceneTags) == 0)
}

func (s *tagEditTestRunner) testApplyMergeTagEdit() {
	mergeSource1, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	mergeSource2, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	mergeTarget, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	// Scene with tag from both source and target, should not cause db unique error
	sceneInput := models.SceneCreateInput{
		TagIds: []uuid.UUID{mergeSource2.UUID(), mergeTarget.UUID()},
		Date:   "2020-03-02",
	}
	scene1, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	sceneInput = models.SceneCreateInput{
		TagIds: []uuid.UUID{mergeSource1.UUID(), mergeSource2.UUID()},
		Date:   "2020-03-02",
	}
	scene2, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	newDescription := "newDescription4"
	newAlias := "newTagAlias4"
	newName := "newName4"
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name:        &newName,
		Description: &newDescription,
		Aliases:     []string{newAlias},
	}
	id := mergeTarget.UUID()
	mergeSources := []uuid.UUID{mergeSource1.UUID(), mergeSource2.UUID()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	mergeEdit, err := s.createTestTagEdit(models.OperationEnumMerge, &tagEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	appliedMerge, err := s.applyEdit(mergeEdit.ID)
	assert.NilError(s.t, err)

	scene1, err = s.client.findScene(scene1.UUID())
	assert.NilError(s.t, err, "Error finding scene")

	scene2, err = s.client.findScene(scene2.UUID())
	assert.NilError(s.t, err, "Error finding scene")

	s.verifyAppliedMergeTagEdit(tagEditDetailsInput, appliedMerge, scene1, scene2)
}

func (s *tagEditTestRunner) verifyAppliedMergeTagEdit(input models.TagEditDetailsInput, edit *models.Edit, scene1, scene2 *sceneOutput) {
	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(true, edit)

	tagDetails := s.getEditTagDetails(edit)
	assert.Equal(s.t, *input.Name, *tagDetails.Name)
	assert.Equal(s.t, *input.Description, *tagDetails.Description)

	assert.DeepEqual(s.t, input.Aliases, tagDetails.AddedAliases)

	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		tag := merges[i].(*models.Tag)
		assert.Equal(s.t, tag.Deleted, true)
	}

	editTarget := s.getEditTagTarget(edit)
	scene1Tags := scene1.Tags
	assert.Equal(s.t, len(scene1Tags), 1)
	assert.Equal(s.t, scene1Tags[0].ID, editTarget.ID.String())

	scene2Tags := scene2.Tags
	assert.Equal(s.t, len(scene2Tags), 1)
	assert.Equal(s.t, scene2Tags[0].ID, editTarget.ID.String())
}

func (s *tagEditTestRunner) testTagEditUpdate() {
	// Create a pending edit
	name := "Original Tag Name"
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name: &name,
	}
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, &tagEditDetailsInput, nil)
	assert.NilError(s.t, err)

	// Update the edit with new details
	newName := "Updated Tag Name"
	updatedDetails := models.TagEditDetailsInput{
		Name: &newName,
	}

	editID := createdEdit.ID
	updatedEdit, err := s.resolver.Mutation().TagEditUpdate(s.ctx, createdEdit.ID, models.TagEditInput{
		Edit:    &models.EditInput{ID: &editID},
		Details: &updatedDetails,
	})
	assert.NilError(s.t, err, "Error updating tag edit")

	// Verify the edit was updated
	assert.Equal(s.t, createdEdit.ID, updatedEdit.ID, "Edit ID should not change")
	assert.Assert(s.t, updatedEdit != nil, "Updated edit should not be nil")
}

func TestCreateTagEdit(t *testing.T) {
	pt := createTagEditTestRunner(t)
	pt.testCreateTagEdit()
}

func TestModifyTagEdit(t *testing.T) {
	pt := createTagEditTestRunner(t)
	pt.testModifyTagEdit()
}

func TestDestroyTagEdit(t *testing.T) {
	pt := createTagEditTestRunner(t)
	pt.testDestroyTagEdit()
}

func TestMergeTagEdit(t *testing.T) {
	pt := createTagEditTestRunner(t)
	pt.testMergeTagEdit()
}

func TestApplyCreateTagEdit(t *testing.T) {
	pt := createTagEditTestRunner(t)
	pt.testApplyCreateTagEdit()
}

func TestApplyModifyTagEdit(t *testing.T) {
	pt := createTagEditTestRunner(t)
	pt.testApplyModifyTagEdit()
}

func TestApplyDestroyTagEdit(t *testing.T) {
	pt := createTagEditTestRunner(t)
	pt.testApplyDestroyTagEdit()
}

func TestApplyMergeTagEdit(t *testing.T) {
	pt := createTagEditTestRunner(t)
	pt.testApplyMergeTagEdit()
}

func TestTagEditUpdate(t *testing.T) {
	pt := createTagEditTestRunner(t)
	pt.testTagEditUpdate()
}
