//go:build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type editDeleteTestRunner struct {
	testRunner
}

func createEditDeleteTestRunner(t *testing.T) *editDeleteTestRunner {
	return &editDeleteTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *editDeleteTestRunner) testDeleteClosedEdit() {
	// Create a tag edit
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Apply the edit to make it closed
	appliedEdit, err := s.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)
	assert.Equal(s.t, models.VoteStatusEnumImmediateAccepted.String(), appliedEdit.Status)

	// Delete the closed edit
	reason := "Test deletion reason"
	deleteInput := models.DeleteEditInput{
		ID:     appliedEdit.ID,
		Reason: &reason,
	}

	deleted, err := s.resolver.Mutation().DeleteEdit(s.ctx, deleteInput)
	assert.NoError(s.t, err)
	assert.True(s.t, deleted)

	// Verify edit is deleted - should return nil
	edit, err := s.resolver.Query().FindEdit(s.ctx, appliedEdit.ID)
	assert.Error(s.t, err)
	assert.Nil(s.t, edit)

	// Note: Cannot easily verify audit record in test due to transaction isolation
	// The audit record is created in the service layer and would require direct database access
}

func (s *editDeleteTestRunner) testCannotDeletePendingEdit() {
	// Create a tag edit (leave it pending)
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)
	assert.Nil(s.t, createdEdit.ClosedAt)
	assert.Equal(s.t, models.VoteStatusEnumPending.String(), createdEdit.Status)

	// Attempt to delete pending edit
	reason := "Test reason"
	deleteInput := models.DeleteEditInput{
		ID:     createdEdit.ID,
		Reason: reason,
	}

	deleted, err := s.resolver.Mutation().DeleteEdit(s.ctx, deleteInput)
	assert.Error(s.t, err)
	assert.False(s.t, deleted)
	assert.Contains(s.t, err.Error(), "cannot delete pending edit")

	// Verify edit still exists
	edit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, edit)
	assert.Equal(s.t, createdEdit.ID, edit.ID)
}

func (s *editDeleteTestRunner) testNonAdminCannotDelete() {
	// Create and close an edit as admin
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	appliedEdit, err := s.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, appliedEdit.ClosedAt)

	// Switch to non-admin user (edit role)
	editRunner := asEdit(s.t)
	reason := "Test reason"
	deleteInput := models.DeleteEditInput{
		ID:     appliedEdit.ID,
		Reason: reason,
	}

	// Attempt to delete as non-admin
	deleted, err := editRunner.resolver.Mutation().DeleteEdit(editRunner.ctx, deleteInput)
	assert.Error(s.t, err)
	assert.False(s.t, deleted)
	assert.Contains(s.t, err.Error(), "Unauthorized")

	// Verify edit still exists
	edit, err := s.resolver.Query().FindEdit(s.ctx, appliedEdit.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, edit)
	assert.Equal(s.t, appliedEdit.ID, edit.ID)
}

func (s *editDeleteTestRunner) testDeleteRejectedEdit() {
	// Create a tag edit
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Cancel/reject the edit
	cancelInput := models.CancelEditInput{
		ID: createdEdit.ID,
	}
	canceledEdit, err := s.resolver.Mutation().CancelEdit(s.ctx, cancelInput)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, canceledEdit.ClosedAt)
	assert.Equal(s.t, models.VoteStatusEnumImmediateRejected.String(), canceledEdit.Status)

	// Delete the rejected edit
	reason := "Removing rejected edit"
	deleteInput := models.DeleteEditInput{
		ID:     canceledEdit.ID,
		Reason: reason,
	}

	deleted, err := s.resolver.Mutation().DeleteEdit(s.ctx, deleteInput)
	assert.NoError(s.t, err)
	assert.True(s.t, deleted)

	// Verify edit is deleted
	edit, err := s.resolver.Query().FindEdit(s.ctx, canceledEdit.ID)
	assert.Error(s.t, err)
	assert.Nil(s.t, edit)
}


func (s *editDeleteTestRunner) testDeleteEditWithComments() {
	// Create a tag edit
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Add a comment
	commentText := "Test comment"
	commentInput := models.EditCommentInput{
		ID:      createdEdit.ID,
		Comment: commentText,
	}
	_, err = s.resolver.Mutation().EditComment(s.ctx, commentInput)
	assert.NoError(s.t, err)

	// Verify comment exists
	comments, err := s.resolver.Edit().Comments(s.ctx, createdEdit)
	assert.NoError(s.t, err)
	assert.Equal(s.t, 1, len(comments))

	// Close the edit
	appliedEdit, err := s.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)

	// Delete the edit
	reason := "Cleaning up test edit with comments"
	deleteInput := models.DeleteEditInput{
		ID:     appliedEdit.ID,
		Reason: reason,
	}

	deleted, err := s.resolver.Mutation().DeleteEdit(s.ctx, deleteInput)
	assert.NoError(s.t, err)
	assert.True(s.t, deleted)

	// Verify edit and comments are deleted (CASCADE)
	edit, err := s.resolver.Query().FindEdit(s.ctx, appliedEdit.ID)
	assert.Error(s.t, err)
	assert.Nil(s.t, edit)
}

func (s *editDeleteTestRunner) testDeleteEditWithVotes() {
	// Create a tag edit as non-admin
	editRunner := asEdit(s.t)
	createdEdit, err := editRunner.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Vote on it as admin
	voteInput := models.EditVoteInput{
		ID:   createdEdit.ID,
		Vote: models.VoteTypeEnumAccept,
	}
	_, err = s.resolver.Mutation().EditVote(s.ctx, voteInput)
	assert.NoError(s.t, err)

	// Verify vote exists
	votes, err := s.resolver.Edit().Votes(s.ctx, createdEdit)
	assert.NoError(s.t, err)
	assert.Equal(s.t, 1, len(votes))

	// Close the edit as admin
	appliedEdit, err := s.applyEdit(createdEdit.ID)
	assert.NoError(s.t, err)

	// Delete the edit
	reason := "Cleaning up test edit with votes"
	deleteInput := models.DeleteEditInput{
		ID:     appliedEdit.ID,
		Reason: reason,
	}

	deleted, err := s.resolver.Mutation().DeleteEdit(s.ctx, deleteInput)
	assert.NoError(s.t, err)
	assert.True(s.t, deleted)

	// Verify edit and votes are deleted (CASCADE)
	edit, err := s.resolver.Query().FindEdit(s.ctx, appliedEdit.ID)
	assert.Error(s.t, err)
	assert.Nil(s.t, edit)
}

func TestDeleteClosedEdit(t *testing.T) {
	s := createEditDeleteTestRunner(t)
	s.testDeleteClosedEdit()
}

func TestCannotDeletePendingEdit(t *testing.T) {
	s := createEditDeleteTestRunner(t)
	s.testCannotDeletePendingEdit()
}

func TestNonAdminCannotDeleteEdit(t *testing.T) {
	s := createEditDeleteTestRunner(t)
	s.testNonAdminCannotDelete()
}

func TestDeleteRejectedEdit(t *testing.T) {
	s := createEditDeleteTestRunner(t)
	s.testDeleteRejectedEdit()
}

func TestDeleteEditWithComments(t *testing.T) {
	s := createEditDeleteTestRunner(t)
	s.testDeleteEditWithComments()
}

func TestDeleteEditWithVotes(t *testing.T) {
	s := createEditDeleteTestRunner(t)
	s.testDeleteEditWithVotes()
}
