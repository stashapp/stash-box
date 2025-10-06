//go:build integration
// +build integration

package api_test

import (
	"context"
	"testing"
	"time"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	"gotest.tools/v3/assert"
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
	assert.NilError(s.t, err)

	editInput := models.CancelEditInput{
		ID: createdEdit.ID,
	}

	pt := createEditTestRunner(s.t)
	cancelEdit, err := s.resolver.Mutation().CancelEdit(pt.ctx, editInput)
	assert.NilError(s.t, err, "Admin failed to cancel edit: %s")
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
	assert.NilError(s.t, err)

	editInput := models.CancelEditInput{
		ID: createdEdit.ID,
	}
	cancelEdit, err := s.resolver.Mutation().CancelEdit(s.ctx, editInput)
	assert.NilError(s.t, err)
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
	assert.NilError(s.t, err)

	text := "some comment text"
	editInput := models.EditCommentInput{
		ID:      createdEdit.ID,
		Comment: text,
	}
	editComment, err := s.resolver.Mutation().EditComment(s.ctx, editInput)
	assert.NilError(s.t, err)
	s.verifyEditComment(editComment, text)
}

func (s *editTestRunner) verifyEditComment(edit *models.Edit, comment string) {
	comments, _ := s.resolver.Edit().Comments(s.ctx, edit)
	assert.Assert(s.t, len(comments) == 1)
	assert.Equal(s.t, comments[0].Text, comment)
}

func (s *editTestRunner) testVotePermissionsPromotion() {
	createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumEdit})
	assert.NilError(s.t, err)

	for i := 1; i <= 10; i++ {
		s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)
		createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
		assert.NilError(s.t, err)
		s.ctx = context.WithValue(s.ctx, auth.ContextRoles, userDB.adminRoles)
		_, err = s.applyEdit(createdEdit.ID)
		assert.NilError(s.t, err)
	}
	s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)

	// Wait for async promotion to complete
	time.Sleep(50 * time.Millisecond)

	userID := createdUser.ID
	user, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	assert.NilError(s.t, err)

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
	assert.Equal(s.t, hasVotePermission, true)
}

func (s *editTestRunner) testPositiveEditVoteApplication() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NilError(s.t, err)

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		assert.NilError(s.t, err)
		s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: models.VoteTypeEnumAccept,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NilError(s.t, err)

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
	assert.NilError(s.t, err)

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		assert.NilError(s.t, err)
		s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: models.VoteTypeEnumReject,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NilError(s.t, err)

	s.verifyEditRejected(updatedEdit)
}

func (s *editTestRunner) testEditVoteNotApplying() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NilError(s.t, err)

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		assert.NilError(s.t, err)
		s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)

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
	assert.NilError(s.t, err)

	s.verifyEditPending(updatedEdit)
}

func (s *editTestRunner) verifyEditPending(edit *models.Edit) {
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
}

func (s *editTestRunner) testDestructiveEditsNotAutoApplied() {
	createdTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	id := createdTag.UUID()
	input := models.EditInput{
		ID:        &id,
		Operation: models.OperationEnumDestroy,
	}
	createdEdit, err := s.createTestTagEdit(models.OperationEnumDestroy, nil, &input)
	assert.NilError(s.t, err)

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		assert.NilError(s.t, err)
		s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: models.VoteTypeEnumAccept,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NilError(s.t, err)

	s.verifyEditPending(updatedEdit)
}

func (s *editTestRunner) testVoteOwnedEditsDisallowed() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NilError(s.t, err)

	_, err = s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
		ID:   createdEdit.ID,
		Vote: models.VoteTypeEnumAccept,
	})
	assert.ErrorIs(s.t, err, auth.ErrUnauthorized)
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
