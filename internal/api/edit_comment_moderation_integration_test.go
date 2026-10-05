//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type editCommentModerationTestRunner struct {
	testRunner
}

func createEditCommentModerationTestRunner(t *testing.T) *editCommentModerationTestRunner {
	return &editCommentModerationTestRunner{
		testRunner: *asModerate(t),
	}
}

// createEditWithComments creates a tag edit (as an editor) carrying a submission
// comment, then adds a reply comment. Returns the edit and the reply's ID.
func (s *editCommentModerationTestRunner) createEditWithComments(editor *testRunner, submission, reply string) (*models.Edit, uuid.UUID) {
	s.t.Helper()

	editInput := models.EditInput{
		Operation: models.OperationEnumCreate,
		Comment:   &submission,
	}
	edit, err := editor.createTestTagEdit(models.OperationEnumCreate, nil, &editInput)
	assert.NoError(s.t, err)

	_, err = editor.resolver.Mutation().EditComment(editor.ctx, models.EditCommentInput{
		ID:      edit.ID,
		Comment: reply,
	})
	assert.NoError(s.t, err)

	comments, err := s.resolver.Edit().Comments(s.ctx, edit)
	assert.NoError(s.t, err)
	replyComment := findComment(comments, reply)
	assert.NotNil(s.t, replyComment)

	return edit, replyComment.ID
}

func findComment(comments []models.EditComment, text string) *models.EditComment {
	for i := range comments {
		if comments[i].Text == text {
			return &comments[i]
		}
	}
	return nil
}

func (s *editCommentModerationTestRunner) testUpdateComment() {
	editor := asEdit(s.t)
	edit, replyID := s.createEditWithComments(editor, "submission", "original reply")

	updated, err := s.resolver.Mutation().UpdateEditComment(s.ctx, models.UpdateEditCommentInput{
		ID:      replyID,
		Comment: "[redacted]",
	})
	assert.NoError(s.t, err)
	assert.Equal(s.t, "[redacted]", updated.Text)
	assert.NotNil(s.t, updated.UpdatedAt)

	// Verify the change is persisted
	comments, err := s.resolver.Edit().Comments(s.ctx, edit)
	assert.NoError(s.t, err)
	reply := findComment(comments, "[redacted]")
	assert.NotNil(s.t, reply)
	assert.NotNil(s.t, reply.UpdatedAt)
	assert.Nil(s.t, findComment(comments, "original reply"))
}

func (s *editCommentModerationTestRunner) testHideComment() {
	editor := asEdit(s.t)
	edit, replyID := s.createEditWithComments(editor, "submission", "reply to hide")

	hidden, err := s.resolver.Mutation().HideEditComment(s.ctx, models.HideEditCommentInput{
		ID:     replyID,
		Hidden: true,
	})
	assert.NoError(s.t, err)
	assert.True(s.t, hidden.IsHidden)

	// Moderator still sees the hidden comment
	modComments, err := s.resolver.Edit().Comments(s.ctx, edit)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, findComment(modComments, "reply to hide"))

	// The author (owner) still sees their hidden comment
	ownerComments, err := editor.resolver.Edit().Comments(editor.ctx, edit)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, findComment(ownerComments, "reply to hide"))

	// An unrelated, non-moderator user does not see it
	reader := asRead(s.t)
	readerComments, err := reader.resolver.Edit().Comments(reader.ctx, edit)
	assert.NoError(s.t, err)
	assert.Nil(s.t, findComment(readerComments, "reply to hide"))
	// ...but still sees the non-hidden submission comment
	assert.NotNil(s.t, findComment(readerComments, "submission"))
}

func (s *editCommentModerationTestRunner) testUnhideComment() {
	editor := asEdit(s.t)
	edit, replyID := s.createEditWithComments(editor, "submission", "reply to toggle")

	_, err := s.resolver.Mutation().HideEditComment(s.ctx, models.HideEditCommentInput{
		ID:     replyID,
		Hidden: true,
	})
	assert.NoError(s.t, err)

	unhidden, err := s.resolver.Mutation().HideEditComment(s.ctx, models.HideEditCommentInput{
		ID:     replyID,
		Hidden: false,
	})
	assert.NoError(s.t, err)
	assert.False(s.t, unhidden.IsHidden)

	// A non-moderator user sees it again
	reader := asRead(s.t)
	readerComments, err := reader.resolver.Edit().Comments(reader.ctx, edit)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, findComment(readerComments, "reply to toggle"))
}

func (s *editCommentModerationTestRunner) testCannotHidePrimaryComment() {
	editor := asEdit(s.t)
	edit, _ := s.createEditWithComments(editor, "primary submission", "a reply")

	comments, err := s.resolver.Edit().Comments(s.ctx, edit)
	assert.NoError(s.t, err)
	primary := findComment(comments, "primary submission")
	assert.NotNil(s.t, primary)

	_, err = s.resolver.Mutation().HideEditComment(s.ctx, models.HideEditCommentInput{
		ID:     primary.ID,
		Hidden: true,
	})
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "primary comment")
}

func (s *editCommentModerationTestRunner) testNonModeratorCannotModerate() {
	editor := asEdit(s.t)
	_, replyID := s.createEditWithComments(editor, "submission", "a reply")

	// Updating via the client enforces the @hasRole(MODERATE) directive
	_, err := editor.client.updateEditComment(models.UpdateEditCommentInput{
		ID:      replyID,
		Comment: "sneaky edit",
	})
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "not authorized")

	_, err = editor.client.hideEditComment(models.HideEditCommentInput{
		ID:     replyID,
		Hidden: true,
	})
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "not authorized")
}

func TestUpdateEditComment(t *testing.T) {
	s := createEditCommentModerationTestRunner(t)
	s.testUpdateComment()
}

func TestHideEditComment(t *testing.T) {
	s := createEditCommentModerationTestRunner(t)
	s.testHideComment()
}

func TestUnhideEditComment(t *testing.T) {
	s := createEditCommentModerationTestRunner(t)
	s.testUnhideComment()
}

func TestCannotHidePrimaryComment(t *testing.T) {
	s := createEditCommentModerationTestRunner(t)
	s.testCannotHidePrimaryComment()
}

func TestNonModeratorCannotModerateComments(t *testing.T) {
	s := createEditCommentModerationTestRunner(t)
	s.testNonModeratorCannotModerate()
}
