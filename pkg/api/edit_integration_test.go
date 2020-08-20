// +build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stashdb/pkg/api"
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

func TestUnauthorisedEditEdit(t *testing.T) {
	pt := &editTestRunner{
		testRunner: *asRead(t),
	}
	pt.testUnauthorisedEditEdit()
}

func TestUnauthorisedApplyEditAdmin(t *testing.T) {
	pt := &editTestRunner{
		testRunner: *asEdit(t),
	}
	pt.testUnauthorisedApplyEditAdmin()
}

func TestCancelEdit(t *testing.T) {
	pt := createEditTestRunner(t)
	pt.testCancelEdit()
}
