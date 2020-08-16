// +build integration

package api_test

import (
	"reflect"
	"testing"

	"github.com/stashapp/stashdb/pkg/models"
)

type editTestRunner struct {
	testRunner
}

func createEditTestRunner(t *testing.T) *editTestRunner {
	return &editTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *editTestRunner) testCreateTagEdit() {
	name := "Name"
	description := "Description"
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name:        &name,
		Description: &description,
		Aliases:     []string{"Alias1"},
	}
	edit, err := s.createTestTagEdit(models.OperationEnumCreate, &tagEditDetailsInput, nil)
	if err == nil {
		s.verifyCreatedTagEdit(tagEditDetailsInput, edit)
	}
}

func (s *editTestRunner) verifyCreatedTagEdit(input models.TagEditDetailsInput, edit *models.Edit) {
	r := s.resolver.Edit()

	id, _ := r.ID(s.ctx, edit)
	if id == "" {
		s.t.Errorf("Expected created edit id to be non-zero")
	}

	details, _ := r.Details(s.ctx, edit)
	tagDetails := details.(*models.TagEdit)

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	if *input.Name != *tagDetails.Name {
		s.fieldMismatch(input.Name, tagDetails.Name, "Name")
	}

	if *input.Description != *tagDetails.Description {
		s.fieldMismatch(input.Description, tagDetails.Description, "Description")
	}

	if !reflect.DeepEqual(input.Aliases, tagDetails.AddedAliases) {
		s.fieldMismatch(input.Aliases, tagDetails.AddedAliases, "Aliases")
	}
}

func (s *editTestRunner) testFindEditById() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	editID := createdEdit.ID.String()
	edit, err := s.resolver.Query().FindEdit(s.ctx, &editID)
	if err != nil {
		s.t.Errorf("Error finding edit: %s", err.Error())
		return
	}

	// ensure returned tag is not nil
	if edit == nil {
		s.t.Error("Did not find edit by id")
		return
	}
}

func (s *editTestRunner) testModifyTagEdit() {
	existingName := "tagName"
	existingAlias := "tagAlias"
	tagCreateInput := models.TagCreateInput{
		Name:    existingName,
		Aliases: []string{existingAlias},
	}
	createdTag, err := s.createTestTag(&tagCreateInput)
	if err != nil {
		return
	}

	newDescription := "newDescription"
	newAlias := "newTagAlias"
	newName := "newName"
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name:        &newName,
		Description: &newDescription,
		Aliases:     []string{newAlias},
	}
	id := createdTag.ID.String()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestTagEdit(models.OperationEnumModify, &tagEditDetailsInput, &editInput)

	s.verifyUpdatedTagEdit(createdTag, tagEditDetailsInput, createdUpdateEdit)
}

func (s *editTestRunner) verifyUpdatedTagEdit(originalTag *models.Tag, input models.TagEditDetailsInput, edit *models.Edit) {
	tagDetails := s.getEditTagDetails(edit)

	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	if *input.Name != *tagDetails.Name {
		s.fieldMismatch(*input.Name, *tagDetails.Name, "Name")
	}

	if *input.Description != *tagDetails.Description {
		s.fieldMismatch(input.Description, tagDetails.Description, "Description")
	}

	tagAliases, _ := s.resolver.Tag().Aliases(s.ctx, originalTag)
	if !reflect.DeepEqual(tagAliases, tagDetails.RemovedAliases) {
		s.fieldMismatch(tagAliases, tagDetails.RemovedAliases, "RemovedAliases")
	}

	if !reflect.DeepEqual(input.Aliases, tagDetails.AddedAliases) {
		s.fieldMismatch(input.Aliases, tagDetails.AddedAliases, "AddedAliases")
	}
}

func (s *editTestRunner) testDestroyTagEdit() {
	createdTag, err := s.createTestTag(nil)
	if err != nil {
		return
	}

	tagID := createdTag.ID.String()

	tagEditDetailsInput := models.TagEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &tagID,
	}
	destroyEdit, err := s.createTestTagEdit(models.OperationEnumDestroy, &tagEditDetailsInput, &editInput)

	s.verifyDestroyTagEdit(tagID, destroyEdit)
}

func (s *editTestRunner) verifyDestroyTagEdit(tagID string, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)

	editTarget := s.getEditTagTarget(edit)

	if tagID != editTarget.ID.String() {
		s.fieldMismatch(tagID, editTarget.ID.String(), "ID")
	}
}

func (s *editTestRunner) testMergeTagEdit() {
	existingName := "tagName2"
	existingAlias := "tagAlias2"
	tagCreateInput := models.TagCreateInput{
		Name:    existingName,
		Aliases: []string{existingAlias},
	}
	createdPrimaryTag, err := s.createTestTag(&tagCreateInput)
	if err != nil {
		return
	}

	createdMergeTag, err := s.createTestTag(nil)

	newDescription := "newDescription2"
	newAlias := "newTagAlias2"
	newName := "newName2"
	tagEditDetailsInput := models.TagEditDetailsInput{
		Name:        &newName,
		Description: &newDescription,
		Aliases:     []string{newAlias},
	}
	id := createdPrimaryTag.ID.String()
	mergeSources := []string{createdMergeTag.ID.String()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	createdMergeEdit, err := s.createTestTagEdit(models.OperationEnumMerge, &tagEditDetailsInput, &editInput)

	s.verifyMergeTagEdit(createdPrimaryTag, tagEditDetailsInput, createdMergeEdit, mergeSources)
}

func (s *editTestRunner) verifyMergeTagEdit(originalTag *models.Tag, input models.TagEditDetailsInput, edit *models.Edit, inputMergeSources []string) {
	tagDetails := s.getEditTagDetails(edit)

	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	if *input.Name != *tagDetails.Name {
		s.fieldMismatch(*input.Name, *tagDetails.Name, "Name")
	}

	if *input.Description != *tagDetails.Description {
		s.fieldMismatch(input.Description, tagDetails.Description, "Description")
	}

	tagAliases, _ := s.resolver.Tag().Aliases(s.ctx, originalTag)
	if !reflect.DeepEqual(tagAliases, tagDetails.RemovedAliases) {
		s.fieldMismatch(tagAliases, tagDetails.RemovedAliases, "RemovedAliases")
	}

	if !reflect.DeepEqual(input.Aliases, tagDetails.AddedAliases) {
		s.fieldMismatch(input.Aliases, tagDetails.AddedAliases, "AddedAliases")
	}

	mergeSources := []string{}
	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i, _ := range merges {
		merge := merges[i].(*models.Tag)
		mergeSources = append(mergeSources, merge.ID.String())
	}
	if !reflect.DeepEqual(inputMergeSources, mergeSources) {
		s.fieldMismatch(inputMergeSources, mergeSources, "MergeSources")
	}
}

func (s *editTestRunner) verifyEditOperation(operation string, edit *models.Edit) {
	if edit.Operation != operation {
		s.fieldMismatch(operation, edit.Operation, "Operation")
	}
}

func (s *editTestRunner) verifyEditStatus(status string, edit *models.Edit) {
	if edit.Status != status {
		s.fieldMismatch(status, edit.Status, "Status")
	}
}

func (s *editTestRunner) verifyEditApplication(applied bool, edit *models.Edit) {
	if edit.Applied != applied {
		s.fieldMismatch(applied, edit.Applied, "Applied")
	}
}

func (s *editTestRunner) verifyEditTargetType(targetType string, edit *models.Edit) {
	if edit.TargetType != targetType {
		s.fieldMismatch(targetType, edit.TargetType, "TargetType")
	}
}

func TestCreateTagEdit(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testCreateTagEdit()
}

func TestModifyTagEdit(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testModifyTagEdit()
}

func TestDestroyTagEdit(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testDestroyTagEdit()
}

func TestMergeTagEdit(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testMergeTagEdit()
}
