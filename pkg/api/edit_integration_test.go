//go:build integration
// +build integration

package api_test

import (
	"context"
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

func (s *editTestRunner) testAdminCancelEdit() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	editInput := models.CancelEditInput{
		ID: createdEdit.ID,
	}

	pt := createEditTestRunner(s.t)
	cancelEdit, err := s.resolver.Mutation().CancelEdit(pt.ctx, editInput)
	s.verifyAdminCancelEdit(cancelEdit)
}

func (s *editTestRunner) verifyAdminCancelEdit(edit *models.Edit) {
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
		ID: createdEdit.ID,
	}
	cancelEdit, err := s.resolver.Mutation().CancelEdit(s.ctx, editInput)
	s.verifyOwnerCancelEdit(cancelEdit)
}

func (s *editTestRunner) verifyOwnerCancelEdit(edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumCanceled.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumTag.String(), edit)
	s.verifyEditApplication(false, edit)
}

func (s *editTestRunner) testEditComment() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	text := "some comment text"
	editInput := models.EditCommentInput{
		ID:      createdEdit.ID,
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
		s.ctx = context.WithValue(s.ctx, user.ContextUser, createdUser)
		createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
		if err != nil {
			return
		}
		s.ctx = context.WithValue(s.ctx, user.ContextRoles, userDB.adminRoles)
		_, err = s.applyEdit(createdEdit.ID)
		if err != nil {
			return
		}
	}
	s.ctx = context.WithValue(s.ctx, user.ContextUser, createdUser)

	userID := createdUser.ID
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

func (s *editTestRunner) testPositiveEditVoteApplication() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		if err != nil {
			return
		}
		s.ctx = context.WithValue(s.ctx, user.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: models.VoteTypeEnumAccept,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)

	s.verifyEditApplied(updatedEdit)
}

func (s *editTestRunner) verifyEditApplied(edit *models.Edit) {
	s.verifyEditStatus(models.VoteStatusEnumAccepted.String(), edit)
}

func (s *editTestRunner) verifyEditRejected(edit *models.Edit) {
	s.verifyEditStatus(models.VoteStatusEnumRejected.String(), edit)
}

func (s *editTestRunner) testNegativeEditVoteApplication() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		if err != nil {
			return
		}
		s.ctx = context.WithValue(s.ctx, user.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: models.VoteTypeEnumReject,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)

	s.verifyEditRejected(updatedEdit)
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
		s.ctx = context.WithValue(s.ctx, user.ContextUser, createdUser)

		vote := models.VoteTypeEnumAccept
		if i == 3 {
			vote = models.VoteTypeEnumReject
		}
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: vote,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)

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
	id := createdTag.UUID()
	input := models.EditInput{
		ID:        &id,
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
		s.ctx = context.WithValue(s.ctx, user.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: models.VoteTypeEnumAccept,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)

	s.verifyEditPending(updatedEdit)
}

func (s *editTestRunner) testVoteOwnedEditsDisallowed() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	_, err = s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
		ID:   createdEdit.ID,
		Vote: models.VoteTypeEnumAccept,
	})

	if err != user.ErrUnauthorized {
		s.t.Errorf("Voting: got %v want %v", err, user.ErrUnauthorized)
	}
}

func TestAdminCancelEdit(t *testing.T) {
	pt := &editTestRunner{
		testRunner: *asEdit(t),
	}
	pt.testAdminCancelEdit()
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

func TestPositiveEditVoteApplication(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testPositiveEditVoteApplication()
}

func TestNegativeEditVoteApplication(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testNegativeEditVoteApplication()
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
