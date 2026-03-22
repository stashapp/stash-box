//go:build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type editAmendTestRunner struct {
	testRunner
}

func createEditAmendTestRunner(t *testing.T) *editAmendTestRunner {
	return &editAmendTestRunner{
		testRunner: *asModerate(t),
	}
}

func (s *editAmendTestRunner) testAmendClosedEdit() {
	// Create a performer edit with name and aliases
	name := s.generatePerformerName()
	aliases := []string{"Alias1", "Alias2"}
	detailsInput := &models.PerformerEditDetailsInput{
		Name:    &name,
		Aliases: aliases,
	}
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, detailsInput, nil, nil)
	assert.NoError(s.t, err)

	// Apply the edit to make it closed (requires admin)
	adminRunner := asAdmin(s.t)
	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)

	// Amend the edit - remove the name field
	reason := "Removing incorrect name"
	amendInput := models.AmendEditInput{
		ID:           appliedEdit.ID,
		Reason:       reason,
		RemoveFields: []string{"name"},
	}

	amendedEdit, err := s.resolver.Mutation().AmendEdit(s.ctx, amendInput)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, amendedEdit)

	// Verify the edit still exists and can be fetched
	edit, err := s.resolver.Query().FindEdit(s.ctx, appliedEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, edit)
}

func (s *editAmendTestRunner) testAmendArrayItems() {
	// Create a performer edit with multiple aliases
	name := s.generatePerformerName()
	aliases := []string{"Alias1", "Alias2", "Alias3"}
	detailsInput := &models.PerformerEditDetailsInput{
		Name:    &name,
		Aliases: aliases,
	}
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, detailsInput, nil, nil)
	assert.NoError(s.t, err)

	// Apply the edit
	adminRunner := asAdmin(s.t)
	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)

	// Amend the edit - remove one alias
	reason := "Removing incorrect alias"
	amendInput := models.AmendEditInput{
		ID:     appliedEdit.ID,
		Reason: reason,
		RemoveAddedItems: []models.AmendItemRemoval{
			{
				Field:   "aliases",
				Indices: []int{1}, // Remove "Alias2"
			},
		},
	}

	amendedEdit, err := s.resolver.Mutation().AmendEdit(s.ctx, amendInput)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, amendedEdit)
}

func (s *editAmendTestRunner) testCannotAmendPendingEdit() {
	// Create a performer edit (leave it pending)
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, nil, nil, nil)
	assert.NoError(s.t, err)
	assert.Nil(s.t, createdEdit.ClosedAt)
	assert.Equal(s.t, models.VoteStatusEnumPending.String(), createdEdit.Status)

	// Attempt to amend pending edit
	reason := "Test reason"
	amendInput := models.AmendEditInput{
		ID:           createdEdit.ID,
		Reason:       reason,
		RemoveFields: []string{"name"},
	}

	_, err = s.resolver.Mutation().AmendEdit(s.ctx, amendInput)
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "cannot amend pending edit")
}

func (s *editAmendTestRunner) testNonModeratorCannotAmend() {
	// Create and close an edit as moderator
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, nil, nil, nil)
	assert.NoError(s.t, err)

	adminRunner := asAdmin(s.t)
	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)

	// Switch to non-moderator user (edit role only)
	editRunner := asEdit(s.t)
	reason := "Test reason"
	amendInput := models.AmendEditInput{
		ID:           appliedEdit.ID,
		Reason:       reason,
		RemoveFields: []string{"name"},
	}

	// Attempt to amend as non-moderator
	_, err = editRunner.resolver.Mutation().AmendEdit(editRunner.ctx, amendInput)
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "not authorized")
}

func (s *editAmendTestRunner) testAmendRequiresReason() {
	// Create and close an edit with multiple fields
	name := s.generatePerformerName()
	aliases := []string{"Alias1", "Alias2"}
	detailsInput := &models.PerformerEditDetailsInput{
		Name:    &name,
		Aliases: aliases,
	}
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, detailsInput, nil, nil)
	assert.NoError(s.t, err)

	adminRunner := asAdmin(s.t)
	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)

	// Attempt to amend with empty reason - should still work as the reason is just metadata
	// The validation is for having at least one removal
	amendInput := models.AmendEditInput{
		ID:           appliedEdit.ID,
		Reason:       "", // Empty reason
		RemoveFields: []string{"name"},
	}

	// Empty reason is allowed at the backend level - the frontend enforces required
	_, err = s.resolver.Mutation().AmendEdit(s.ctx, amendInput)
	assert.NoError(s.t, err)
}

func (s *editAmendTestRunner) testAmendRequiresChanges() {
	// Create and close an edit
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, nil, nil, nil)
	assert.NoError(s.t, err)

	adminRunner := asAdmin(s.t)
	appliedEdit, err := adminRunner.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)

	// Attempt to amend without specifying any removals
	amendInput := models.AmendEditInput{
		ID:     appliedEdit.ID,
		Reason: "Some reason",
		// No RemoveFields, RemoveAddedItems, or RemoveRemovedItems
	}

	_, err = s.resolver.Mutation().AmendEdit(s.ctx, amendInput)
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "must specify at least one field or item to remove")
}

func TestAmendClosedEdit(t *testing.T) {
	s := createEditAmendTestRunner(t)
	s.testAmendClosedEdit()
}

func TestAmendArrayItems(t *testing.T) {
	s := createEditAmendTestRunner(t)
	s.testAmendArrayItems()
}

func TestCannotAmendPendingEdit(t *testing.T) {
	s := createEditAmendTestRunner(t)
	s.testCannotAmendPendingEdit()
}

func TestNonModeratorCannotAmendEdit(t *testing.T) {
	s := createEditAmendTestRunner(t)
	s.testNonModeratorCannotAmend()
}

func TestAmendRequiresReason(t *testing.T) {
	s := createEditAmendTestRunner(t)
	s.testAmendRequiresReason()
}

func TestAmendRequiresChanges(t *testing.T) {
	s := createEditAmendTestRunner(t)
	s.testAmendRequiresChanges()
}
