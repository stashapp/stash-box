//go:build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type editModUpdateTestRunner struct {
	testRunner
}

func createEditModUpdateTestRunner(t *testing.T) *editModUpdateTestRunner {
	return &editModUpdateTestRunner{
		testRunner: *asModify(t),
	}
}

func (s *editModUpdateTestRunner) testModUpdateClosedTagEdit() {
	// Create a tag edit as admin
	adminRunner := asAdmin(s.t)
	name := adminRunner.generateTagName()
	detailsInput := models.TagEditDetailsInput{
		Name: &name,
	}
	createdEdit, err := adminRunner.createTestTagEdit(models.OperationEnumCreate, &detailsInput, nil)
	assert.NoError(s.t, err)

	// Apply the edit to make it closed
	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)

	// Mod update the closed edit
	newName := s.generateTagName()
	newDescription := "Updated description"
	modInput := models.ModEditInput{
		ID:     appliedEdit.ID,
		Reason: "Fixing typo in tag name",
	}
	newDetails := models.TagEditDetailsInput{
		Name:        &newName,
		Description: &newDescription,
	}

	updatedEdit, err := s.resolver.Mutation().ModTagEditUpdate(s.ctx, modInput, newDetails)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, updatedEdit)
	assert.Equal(s.t, appliedEdit.ID, updatedEdit.ID)

	// Verify the edit data was updated by checking details
	details, err := s.resolver.Edit().Details(s.ctx, updatedEdit)
	assert.NoError(s.t, err)
	tagDetails, ok := details.(*models.TagEdit)
	assert.True(s.t, ok)
	assert.Equal(s.t, newName, *tagDetails.Name)
	assert.Equal(s.t, newDescription, *tagDetails.Description)

	// Verify a comment was added
	comments, err := s.resolver.Edit().Comments(s.ctx, updatedEdit)
	assert.NoError(s.t, err)
	assert.GreaterOrEqual(s.t, len(comments), 1)
	// Find the comment from the mod update
	foundComment := false
	for _, c := range comments {
		if c.Text != "" && len(c.Text) > 10 {
			foundComment = true
			assert.Contains(s.t, c.Text, "moderator")
			assert.Contains(s.t, c.Text, "Fixing typo")
			break
		}
	}
	assert.True(s.t, foundComment, "Should find comment from mod update")
}

func (s *editModUpdateTestRunner) testCannotModUpdatePendingEdit() {
	// Create a tag edit (leave it pending)
	adminRunner := asAdmin(s.t)
	createdEdit, err := adminRunner.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)
	assert.Nil(s.t, createdEdit.ClosedAt)
	assert.Equal(s.t, models.VoteStatusEnumPending.String(), createdEdit.Status)

	// Attempt to mod update pending edit
	newName := s.generateTagName()
	modInput := models.ModEditInput{
		ID:     createdEdit.ID,
		Reason: "Should fail",
	}
	newDetails := models.TagEditDetailsInput{
		Name: &newName,
	}

	_, err = s.resolver.Mutation().ModTagEditUpdate(s.ctx, modInput, newDetails)
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "closed")

	// Verify edit was not modified
	edit, err := adminRunner.resolver.Query().FindEdit(adminRunner.ctx, createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, edit)
	assert.Equal(s.t, models.VoteStatusEnumPending.String(), edit.Status)
}

func (s *editModUpdateTestRunner) testNonModeratorCannotModUpdate() {
	// Create and close an edit as admin
	adminRunner := asAdmin(s.t)
	createdEdit, err := adminRunner.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)

	// Switch to non-moderator user (edit role only)
	editRunner := asEdit(s.t)
	newName := editRunner.generateTagName()
	modInput := models.ModEditInput{
		ID:     appliedEdit.ID,
		Reason: "Should fail",
	}
	newDetails := models.TagEditDetailsInput{
		Name: &newName,
	}

	// Attempt to mod update as non-moderator
	_, err = editRunner.resolver.Mutation().ModTagEditUpdate(editRunner.ctx, modInput, newDetails)
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "Unauthorized")
}

func (s *editModUpdateTestRunner) testModUpdateRequiresReason() {
	// Create and close an edit
	adminRunner := asAdmin(s.t)
	createdEdit, err := adminRunner.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)

	// Attempt mod update without reason
	newName := s.generateTagName()
	modInput := models.ModEditInput{
		ID:     appliedEdit.ID,
		Reason: "", // empty reason
	}
	newDetails := models.TagEditDetailsInput{
		Name: &newName,
	}

	_, err = s.resolver.Mutation().ModTagEditUpdate(s.ctx, modInput, newDetails)
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "reason")
}

func (s *editModUpdateTestRunner) testModUpdateRejectsNoChanges() {
	// Create and close an edit
	adminRunner := asAdmin(s.t)
	name := adminRunner.generateTagName()
	detailsInput := models.TagEditDetailsInput{
		Name: &name,
	}
	createdEdit, err := adminRunner.createTestTagEdit(models.OperationEnumCreate, &detailsInput, nil)
	assert.NoError(s.t, err)

	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)

	// Attempt mod update with same data (no changes)
	modInput := models.ModEditInput{
		ID:     appliedEdit.ID,
		Reason: "Should fail - no changes",
	}
	// Don't change anything - pass empty details
	newDetails := models.TagEditDetailsInput{}

	_, err = s.resolver.Mutation().ModTagEditUpdate(s.ctx, modInput, newDetails)
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "no changes")
}

func (s *editModUpdateTestRunner) testModUpdateTargetTypeMismatch() {
	// Create and close a tag edit
	adminRunner := asAdmin(s.t)
	createdEdit, err := adminRunner.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)

	// Attempt to mod update as performer (wrong type)
	modInput := models.ModEditInput{
		ID:     appliedEdit.ID,
		Reason: "Should fail - wrong type",
	}
	performerName := "Some performer"
	performerDetails := models.PerformerEditDetailsInput{
		Name: &performerName,
	}

	_, err = s.resolver.Mutation().ModPerformerEditUpdate(s.ctx, modInput, performerDetails)
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "target type")
}

func (s *editModUpdateTestRunner) testModUpdatePerformerEdit() {
	// Create a performer edit as admin
	adminRunner := asAdmin(s.t)
	name := adminRunner.generatePerformerName()
	detailsInput := models.PerformerEditDetailsInput{
		Name: &name,
	}
	createdEdit, err := adminRunner.createTestPerformerEdit(models.OperationEnumCreate, &detailsInput, nil, nil)
	assert.NoError(s.t, err)

	// Apply the edit to make it closed
	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)

	// Mod update the performer edit
	newName := s.generatePerformerName()
	newDisambig := "New disambiguation"
	modInput := models.ModEditInput{
		ID:     appliedEdit.ID,
		Reason: "Correcting performer info",
	}
	newDetails := models.PerformerEditDetailsInput{
		Name:           &newName,
		Disambiguation: &newDisambig,
	}

	updatedEdit, err := s.resolver.Mutation().ModPerformerEditUpdate(s.ctx, modInput, newDetails)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, updatedEdit)

	// Verify the edit data was updated
	details, err := s.resolver.Edit().Details(s.ctx, updatedEdit)
	assert.NoError(s.t, err)
	performerDetails, ok := details.(*models.PerformerEdit)
	assert.True(s.t, ok)
	assert.Equal(s.t, newName, *performerDetails.Name)
	assert.Equal(s.t, newDisambig, *performerDetails.Disambiguation)
}

func (s *editModUpdateTestRunner) testModUpdateStudioEdit() {
	// Create a studio edit as admin
	adminRunner := asAdmin(s.t)
	name := adminRunner.generateStudioName()
	detailsInput := models.StudioEditDetailsInput{
		Name: &name,
	}
	createdEdit, err := adminRunner.createTestStudioEdit(models.OperationEnumCreate, &detailsInput, nil)
	assert.NoError(s.t, err)

	// Apply the edit to make it closed
	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)

	// Mod update the studio edit
	newName := s.generateStudioName()
	modInput := models.ModEditInput{
		ID:     appliedEdit.ID,
		Reason: "Correcting studio name",
	}
	newDetails := models.StudioEditDetailsInput{
		Name: &newName,
	}

	updatedEdit, err := s.resolver.Mutation().ModStudioEditUpdate(s.ctx, modInput, newDetails)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, updatedEdit)

	// Verify the edit data was updated
	details, err := s.resolver.Edit().Details(s.ctx, updatedEdit)
	assert.NoError(s.t, err)
	studioDetails, ok := details.(*models.StudioEdit)
	assert.True(s.t, ok)
	assert.Equal(s.t, newName, *studioDetails.Name)
}

func (s *editModUpdateTestRunner) testModUpdateSceneEdit() {
	// Create a scene edit as admin
	adminRunner := asAdmin(s.t)
	title := "Test Scene Title"
	detailsInput := models.SceneEditDetailsInput{
		Title: &title,
	}
	createdEdit, err := adminRunner.createTestSceneEdit(models.OperationEnumCreate, &detailsInput, nil)
	assert.NoError(s.t, err)

	// Apply the edit to make it closed
	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)

	// Mod update the scene edit
	newTitle := "Updated Scene Title"
	newDetails := "Scene details here"
	modInput := models.ModEditInput{
		ID:     appliedEdit.ID,
		Reason: "Correcting scene title",
	}
	updateDetails := models.SceneEditDetailsInput{
		Title:   &newTitle,
		Details: &newDetails,
	}

	updatedEdit, err := s.resolver.Mutation().ModSceneEditUpdate(s.ctx, modInput, updateDetails)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, updatedEdit)

	// Verify the edit data was updated
	details, err := s.resolver.Edit().Details(s.ctx, updatedEdit)
	assert.NoError(s.t, err)
	sceneDetails, ok := details.(*models.SceneEdit)
	assert.True(s.t, ok)
	assert.Equal(s.t, newTitle, *sceneDetails.Title)
	assert.Equal(s.t, newDetails, *sceneDetails.Details)
}

func TestModUpdateClosedTagEdit(t *testing.T) {
	s := createEditModUpdateTestRunner(t)
	s.testModUpdateClosedTagEdit()
}

func TestCannotModUpdatePendingEdit(t *testing.T) {
	s := createEditModUpdateTestRunner(t)
	s.testCannotModUpdatePendingEdit()
}

func TestNonModeratorCannotModUpdate(t *testing.T) {
	s := createEditModUpdateTestRunner(t)
	s.testNonModeratorCannotModUpdate()
}

func TestModUpdateRequiresReason(t *testing.T) {
	s := createEditModUpdateTestRunner(t)
	s.testModUpdateRequiresReason()
}

func TestModUpdateRejectsNoChanges(t *testing.T) {
	s := createEditModUpdateTestRunner(t)
	s.testModUpdateRejectsNoChanges()
}

func TestModUpdateTargetTypeMismatch(t *testing.T) {
	s := createEditModUpdateTestRunner(t)
	s.testModUpdateTargetTypeMismatch()
}

func TestModUpdatePerformerEdit(t *testing.T) {
	s := createEditModUpdateTestRunner(t)
	s.testModUpdatePerformerEdit()
}

func TestModUpdateStudioEdit(t *testing.T) {
	s := createEditModUpdateTestRunner(t)
	s.testModUpdateStudioEdit()
}

func TestModUpdateSceneEdit(t *testing.T) {
	s := createEditModUpdateTestRunner(t)
	s.testModUpdateSceneEdit()
}
