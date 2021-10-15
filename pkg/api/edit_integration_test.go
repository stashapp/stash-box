//go:build integration
// +build integration

package api_test

import (
	"context"
	"testing"

	"github.com/stashapp/stash-box/pkg/api"
	"github.com/stashapp/stash-box/pkg/models"
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
	if err != api.ErrUnauthorized {
		s.t.Errorf("TagCreate: got %v want %v", err, api.ErrUnauthorized)
	}
}

func (s *editTestRunner) testUnauthorisedApplyEditAdmin() {
	// both require admin so should fail
	_, err := s.resolver.Mutation().ApplyEdit(s.ctx, models.ApplyEditInput{})
	if err != api.ErrUnauthorized {
		s.t.Errorf("TagCreate: got %v want %v", err, api.ErrUnauthorized)
	}

	_, err = s.resolver.Mutation().CancelEdit(s.ctx, models.CancelEditInput{})
	if err != api.ErrUnauthorized {
		s.t.Errorf("TagCreate: got %v want %v", err, api.ErrUnauthorized)
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

func (s *editTestRunner) testVotePermissionsPromotion() {
	createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumEdit})
	if err != nil {
		return
	}

	for i := 1; i <= 10; i++ {
		s.ctx = context.WithValue(s.ctx, api.ContextUser, createdUser)
		createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
		if err != nil {
			return
		}
		s.ctx = context.WithValue(s.ctx, api.ContextUser, userDB.adminRoles)
		_, err = s.applyEdit(createdEdit.ID.String())
		if err != nil {
			return
		}
	}

	userID := createdUser.ID.String()
	user, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	s.verifyUserRolePromotion(user)
}

func (s *editTestRunner) verifyUserRolePromotion(user *models.User) {
	roles, _ := s.resolver.User().Roles(s.ctx, user)

	hasVotePermission := false
	for _, role := range roles {
		if role == models.RoleEnumVote {
			hasVotePermission = true
		}
	}
	if !hasVotePermission {
		s.fieldMismatch(hasVotePermission, true, "User has vote permission")
	}
}

func TestUnauthorisedEditEdit(t *testing.T) {
	pt := &editTestRunner{
		testRunner: *asRead(t),
	}
	pt.testUnauthorisedEditEdit()
}

func (s *editTestRunner) testEditVoteApplication() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		if err != nil {
			return
		}
		s.ctx = context.WithValue(s.ctx, api.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID.String(),
			Vote: models.VoteTypeEnumAccept,
		})
	}

	editID := createdEdit.ID.String()
	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, &editID)

	s.verifyEditApplied(updatedEdit)
}

func (s *editTestRunner) verifyEditApplied(edit *models.Edit) {
	s.verifyEditStatus(models.VoteStatusEnumAccepted.String(), edit)
}

func (s *editTestRunner) testEditVoteNotApplying() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		if err != nil {
			return
		}
		s.ctx = context.WithValue(s.ctx, api.ContextUser, createdUser)

		vote := models.VoteTypeEnumAccept
		if i == 3 {
			vote = models.VoteTypeEnumReject
		}
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID.String(),
			Vote: vote,
		})
	}

	editID := createdEdit.ID.String()
	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, &editID)

	s.verifyEditPending(updatedEdit)
}

func (s *editTestRunner) verifyEditPending(edit *models.Edit) {
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
}

func (s *editTestRunner) testDestructiveEditsNotAutoApplied() {
	createdTag, err := s.createTestTag(nil)
	if err != nil {
		return
	}
	tagID := createdTag.ID.String()
	input := models.EditInput{
		ID:        &tagID,
		Operation: models.OperationEnumDestroy,
	}
	createdEdit, err := s.createTestTagEdit(models.OperationEnumDestroy, nil, &input)
	if err != nil {
		return
	}

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		if err != nil {
			return
		}
		s.ctx = context.WithValue(s.ctx, api.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID.String(),
			Vote: models.VoteTypeEnumAccept,
		})
	}

	editID := createdEdit.ID.String()
	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, &editID)

	s.verifyEditPending(updatedEdit)
}

func (s *editTestRunner) testVoteOwnedEditsDisallowed() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	_, err = s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
		ID:   createdEdit.ID.String(),
		Vote: models.VoteTypeEnumAccept,
	})

	if err != api.ErrUnauthorized {
		s.t.Errorf("Voting: got %v want %v", err, api.ErrUnauthorized)
	}
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

func TestVotePermissionsPromotion(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testVotePermissionsPromotion()
}

func TestEditVoteApplication(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testEditVoteApplication()
}

func TestEditVoteNotApplying(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testEditVoteNotApplying()
}

func TestDestructiveEditsNotAutoApplied(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testDestructiveEditsNotAutoApplied()
}

func TestVoteOwnedEditsDisallowed(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testVoteOwnedEditsDisallowed()
}
