//go:build integration

package api_test

import (
	"context"
	"testing"
	"time"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
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
	assert.NoError(s.t, err)

	editInput := models.CancelEditInput{
		ID: createdEdit.ID,
	}

	pt := createEditTestRunner(s.t)
	cancelEdit, err := s.resolver.Mutation().CancelEdit(pt.ctx, editInput)
	assert.NoError(s.t, err, "Admin failed to cancel edit: %s")
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
	assert.NoError(s.t, err)

	editInput := models.CancelEditInput{
		ID: createdEdit.ID,
	}
	cancelEdit, err := s.resolver.Mutation().CancelEdit(s.ctx, editInput)
	assert.NoError(s.t, err)
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
	assert.NoError(s.t, err)

	text := "some comment text"
	editInput := models.EditCommentInput{
		ID:      createdEdit.ID,
		Comment: text,
	}
	editComment, err := s.resolver.Mutation().EditComment(s.ctx, editInput)
	assert.NoError(s.t, err)
	s.verifyEditComment(editComment, text)
}

func (s *editTestRunner) verifyEditComment(edit *models.Edit, comment string) {
	comments, _ := s.resolver.Edit().Comments(s.ctx, edit)
	assert.True(s.t, len(comments) == 1)
	assert.Equal(s.t, comments[0].Text, comment)
}

func (s *editTestRunner) testVotePermissionsPromotion() {
	createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumEdit})
	assert.NoError(s.t, err)

	for i := 1; i <= 10; i++ {
		s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)
		createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
		assert.NoError(s.t, err)
		s.ctx = context.WithValue(s.ctx, auth.ContextRoles, userDB.adminRoles)
		_, err = s.applyEdit(createdEdit.ID)
		assert.NoError(s.t, err)
	}
	s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)

	// Wait for async promotion to complete
	time.Sleep(50 * time.Millisecond)

	userID := createdUser.ID
	user, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		assert.NoError(s.t, err)
		s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: models.VoteTypeEnumAccept,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		assert.NoError(s.t, err)
		s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: models.VoteTypeEnumReject,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NoError(s.t, err)

	s.verifyEditRejected(updatedEdit)
}

func (s *editTestRunner) testEditVoteNotApplying() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		assert.NoError(s.t, err)
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
	assert.NoError(s.t, err)

	s.verifyEditPending(updatedEdit)
}

func (s *editTestRunner) verifyEditPending(edit *models.Edit) {
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
}

func (s *editTestRunner) testDestructiveEditsNotAutoApplied() {
	createdTag, err := s.createTestTag(nil)
	assert.NoError(s.t, err)

	id := createdTag.UUID()
	input := models.EditInput{
		ID:        &id,
		Operation: models.OperationEnumDestroy,
	}
	createdEdit, err := s.createTestTagEdit(models.OperationEnumDestroy, nil, &input)
	assert.NoError(s.t, err)

	for i := 1; i <= 3; i++ {
		createdUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
		assert.NoError(s.t, err)
		s.ctx = context.WithValue(s.ctx, auth.ContextUser, createdUser)
		s.resolver.Mutation().EditVote(s.ctx, models.EditVoteInput{
			ID:   createdEdit.ID,
			Vote: models.VoteTypeEnumAccept,
		})
	}

	updatedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NoError(s.t, err)

	s.verifyEditPending(updatedEdit)
}

func (s *editTestRunner) testVoteOwnedEditsDisallowed() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

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

func (s *editTestRunner) testQueryEdits() {
	// Create test data: different types of edits with different statuses

	// Create pending performer edit
	_, err := s.createTestPerformerEdit(models.OperationEnumCreate, nil, nil, nil)
	assert.NoError(s.t, err)

	// Create pending scene edit
	_, err = s.createTestSceneEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Create pending studio edit
	studioEdit1, err := s.createTestStudioEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Create pending tag edit
	tagEdit1, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Create a modify edit for an existing performer
	existingPerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)
	performerID := existingPerformer.UUID()
	performerModifyEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, nil, &models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &performerID,
	}, nil)
	assert.NoError(s.t, err)

	// Apply one edit to have an applied edit
	appliedEdit, err := s.applyEdit(tagEdit1.ID)
	assert.NoError(s.t, err)

	// Cancel one edit to have a cancelled edit
	_, err = s.resolver.Mutation().CancelEdit(s.ctx, models.CancelEditInput{
		ID: studioEdit1.ID,
	})
	assert.NoError(s.t, err)

	// Test 1: Query all pending edits
	result, err := s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		Status:    &[]models.VoteStatusEnum{models.VoteStatusEnumPending}[0],
		Page:      1,
		PerPage:   25,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err := s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)
	count, err := s.resolver.QueryEditsResultType().Count(s.ctx, result)
	assert.NoError(s.t, err)

	assert.True(s.t, count >= 3, "Should have at least 3 pending edits")
	assert.True(s.t, len(editsResult) >= 3, "Should return at least 3 pending edits")

	// Verify all returned edits are pending
	for _, edit := range editsResult {
		assert.Equal(s.t, edit.Status, models.VoteStatusEnumPending.String(), "All returned edits should be pending")
	}

	// Test 2: Query by target type (PERFORMER)
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		TargetType: &[]models.TargetTypeEnum{models.TargetTypeEnumPerformer}[0],
		Page:       1,
		PerPage:    25,
		Direction:  models.SortDirectionEnumDesc,
		Sort:       models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)

	assert.True(s.t, len(editsResult) >= 2, "Should have at least 2 performer edits")
	for _, edit := range editsResult {
		assert.Equal(s.t, edit.TargetType, models.TargetTypeEnumPerformer.String(), "All returned edits should be performer type")
	}

	// Test 3: Query by operation (CREATE)
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		Operation: &[]models.OperationEnum{models.OperationEnumCreate}[0],
		Page:      1,
		PerPage:   25,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)

	assert.True(s.t, len(editsResult) >= 4, "Should have at least 4 create edits")
	for _, edit := range editsResult {
		assert.Equal(s.t, edit.Operation, models.OperationEnumCreate.String(), "All returned edits should be CREATE operation")
	}

	// Test 4: Query by operation (MODIFY)
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		Operation: &[]models.OperationEnum{models.OperationEnumModify}[0],
		Page:      1,
		PerPage:   25,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)

	assert.True(s.t, len(editsResult) >= 1, "Should have at least 1 modify edit")
	for _, edit := range editsResult {
		assert.Equal(s.t, edit.Operation, models.OperationEnumModify.String(), "All returned edits should be MODIFY operation")
	}

	// Test 5: Query by applied status (applied=true)
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		Applied:   &[]bool{true}[0],
		Page:      1,
		PerPage:   25,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)

	assert.True(s.t, len(editsResult) >= 1, "Should have at least 1 applied edit")

	// Verify the applied edit is in the results
	foundApplied := false
	for _, edit := range editsResult {
		assert.Equal(s.t, edit.Applied, true, "All returned edits should be applied")
		if edit.ID == appliedEdit.ID {
			foundApplied = true
		}
	}
	assert.True(s.t, foundApplied, "Should find the applied edit we created")

	// Test 6: Query by applied status (applied=false)
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		Applied:   &[]bool{false}[0],
		Page:      1,
		PerPage:   25,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)

	assert.True(s.t, len(editsResult) >= 3, "Should have at least 3 unapplied edits")
	for _, edit := range editsResult {
		assert.Equal(s.t, edit.Applied, false, "All returned edits should be unapplied")
	}

	// Test 7: Query by specific target ID
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		TargetType: &[]models.TargetTypeEnum{models.TargetTypeEnumPerformer}[0],
		TargetID:   &performerID,
		Page:       1,
		PerPage:    25,
		Direction:  models.SortDirectionEnumDesc,
		Sort:       models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)

	assert.True(s.t, len(editsResult) >= 1, "Should have at least 1 edit for the target")
	foundModifyEdit := false
	for _, edit := range editsResult {
		if edit.ID == performerModifyEdit.ID {
			foundModifyEdit = true
		}
	}
	assert.True(s.t, foundModifyEdit, "Should find the modify edit for the specific performer")

	// Test 8: Query by user ID
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		UserID:    &userDB.admin.ID,
		Page:      1,
		PerPage:   25,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)

	assert.True(s.t, len(editsResult) >= 4, "Should have at least 4 edits by the current user")
	for _, edit := range editsResult {
		user, _ := s.resolver.Edit().User(s.ctx, &edit)
		assert.Equal(s.t, user.ID, userDB.admin.ID, "All returned edits should be by the specified user")
	}

	// Test 9: Test pagination
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		Page:      1,
		PerPage:   2,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)
	count, err = s.resolver.QueryEditsResultType().Count(s.ctx, result)
	assert.NoError(s.t, err)

	assert.Equal(s.t, len(editsResult), 2, "Should return exactly 2 edits with per_page=2")
	assert.True(s.t, count >= 4, "Total count should be at least 4")

	// Test 10: Test sorting by CREATED_AT ascending
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		Status:    &[]models.VoteStatusEnum{models.VoteStatusEnumPending}[0],
		Page:      1,
		PerPage:   10,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)

	if len(editsResult) >= 2 {
		// Verify ascending order
		for i := 0; i < len(editsResult)-1; i++ {
			assert.True(s.t, !editsResult[i].CreatedAt.After(editsResult[i+1].CreatedAt),
				"Edits should be sorted by created_at in ascending order")
		}
	}

	// Test 11: Query cancelled edits
	result, err = s.resolver.Query().QueryEdits(s.ctx, models.EditQueryInput{
		Status:    &[]models.VoteStatusEnum{models.VoteStatusEnumCanceled}[0],
		Page:      1,
		PerPage:   25,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.EditSortEnumCreatedAt,
	})
	assert.NoError(s.t, err)

	editsResult, err = s.resolver.QueryEditsResultType().Edits(s.ctx, result)
	assert.NoError(s.t, err)

	assert.True(s.t, len(editsResult) >= 1, "Should have at least 1 cancelled edit")
	for _, edit := range editsResult {
		assert.Equal(s.t, edit.Status, models.VoteStatusEnumCanceled.String(), "All returned edits should be cancelled")
	}
}

func TestQueryEdits(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testQueryEdits()
}
