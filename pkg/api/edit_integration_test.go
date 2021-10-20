//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

type editTestRunner struct {
	testRunner
}

func createEditTestRunner(t *testing.T) *editTestRunner {
	return &editTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *editTestRunner) testUnauthorisedEditEdit() {
	// requires edit so should fail
	_, err := s.resolver.Mutation().TagEdit(s.ctx, models.TagEditInput{})
	if err != user.ErrUnauthorized {
		s.t.Errorf("TagCreate: got %v want %v", err, user.ErrUnauthorized)
	}
}

func (s *editTestRunner) testUnauthorisedApplyEditAdmin() {
	// both require admin so should fail
	_, err := s.resolver.Mutation().ApplyEdit(s.ctx, models.ApplyEditInput{})
	if err != user.ErrUnauthorized {
		s.t.Errorf("TagCreate: got %v want %v", err, user.ErrUnauthorized)
	}

	_, err = s.resolver.Mutation().CancelEdit(s.ctx, models.CancelEditInput{})
	if err != user.ErrUnauthorized {
		s.t.Errorf("TagCreate: got %v want %v", err, user.ErrUnauthorized)
	}
}

func (s *editTestRunner) testCancelEdit() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	editInput := models.CancelEditInput{
		ID: createdEdit.ID.String(),
	}
	cancelEdit, err := s.resolver.Mutation().CancelEdit(s.ctx, editInput)
	s.verifyCancelEdit(cancelEdit)
}

func (s *editTestRunner) verifyCancelEdit(edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateRejected.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)
}

func (s *editTestRunner) testOwnerCancelEdit() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	editInput := models.CancelEditInput{
		ID: createdEdit.ID.String(),
	}
	cancelEdit, err := s.resolver.Mutation().CancelEdit(s.ctx, editInput)
	s.verifyCancelEdit(cancelEdit)
}

func (s *editTestRunner) testEditComment() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	text := "some comment text"
	editInput := models.EditCommentInput{
		ID:      createdEdit.ID.String(),
		Comment: text,
	}
	editComment, err := s.resolver.Mutation().EditComment(s.ctx, editInput)
	s.verifyEditComment(editComment, text)
}

func (s *editTestRunner) verifyEditComment(edit *models.Edit, comment string) {
	comments, _ := s.resolver.Edit().Comments(s.ctx, edit)
	if len(comments) != 1 {
		s.fieldMismatch(1, len(comments), "Comment count")
	} else {
		if comments[0].Text != comment {
			s.fieldMismatch(comments, comments[0].Text, "Comment text")
		}
	}
}

func TestUnauthorisedEditEdit(t *testing.T) {
	pt := &editTestRunner{
		testRunner: *asRead(t),
	}
	pt.testUnauthorisedEditEdit()
}

func TestUnauthorisedApplyEditAdmin(t *testing.T) {
	pt := &editTestRunner{
		testRunner: *asModify(t),
	}
	pt.testUnauthorisedApplyEditAdmin()
}

func TestCancelEdit(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testCancelEdit()
}

func TestOwnerCancelEdit(t *testing.T) {
	pt := &editTestRunner{
		testRunner: *asEdit(t),
	}
	pt.testOwnerCancelEdit()
}

func TestEditComment(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testEditComment()
}
