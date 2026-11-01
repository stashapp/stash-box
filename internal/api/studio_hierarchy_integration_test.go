//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	studioservice "github.com/stashapp/stash-box/internal/service/studio"
	"github.com/stretchr/testify/require"
)

func TestStudioHierarchyMutations(t *testing.T) {
	s := createStudioEditTestRunner(t)
	network, err := s.createTestStudio(nil)
	require.NoError(t, err)
	networkID := network.UUID()
	child, err := s.createTestStudio(&models.StudioCreateInput{Name: s.generateStudioName(), ParentID: &networkID})
	require.NoError(t, err)
	childID := child.UUID()
	other, err := s.createTestStudio(nil)
	require.NoError(t, err)
	otherID := other.UUID()

	_, err = s.resolver.Mutation().StudioCreate(s.ctx, models.StudioCreateInput{Name: s.generateStudioName(), ParentID: &childID})
	require.ErrorIs(t, err, studioservice.ErrInvalidParent)
	for _, tc := range []struct {
		name       string
		id, parent uuid.UUID
	}{
		{"self parent", childID, childID},
		{"child as parent", otherID, childID},
		{"network with children", networkID, otherID},
	} {
		t.Run(tc.name, func(t *testing.T) {
			_, err := s.resolver.Mutation().StudioUpdate(s.ctx, models.StudioUpdateInput{ID: tc.id, ParentID: &tc.parent})
			require.ErrorIs(t, err, studioservice.ErrInvalidParent)
			_, err = s.resolver.Mutation().StudioEdit(s.ctx, models.StudioEditInput{
				Edit:    &models.EditInput{Operation: models.OperationEnumModify, ID: &tc.id},
				Details: &models.StudioEditDetailsInput{ParentID: &tc.parent},
			})
			require.ErrorIs(t, err, studioservice.ErrInvalidParent)
		})
	}
	name := s.generateStudioName()
	_, err = s.resolver.Mutation().StudioEdit(s.ctx, models.StudioEditInput{
		Edit:    &models.EditInput{Operation: models.OperationEnumCreate},
		Details: &models.StudioEditDetailsInput{Name: &name, ParentID: &childID},
	})
	require.ErrorIs(t, err, studioservice.ErrInvalidParent)
	// Moving a leaf studio to a different top-level network remains valid.
	_, err = s.resolver.Mutation().StudioUpdate(s.ctx, models.StudioUpdateInput{ID: childID, ParentID: &otherID})
	require.NoError(t, err)
}

func TestStudioHierarchyRevalidatedOnApproval(t *testing.T) {
	for _, operation := range []models.OperationEnum{models.OperationEnumCreate, models.OperationEnumModify} {
		t.Run(operation.String(), func(t *testing.T) {
			s := createStudioEditTestRunner(t)
			parent, err := s.createTestStudio(nil)
			require.NoError(t, err)
			parentID := parent.UUID()
			target, err := s.createTestStudio(nil)
			require.NoError(t, err)
			targetID := target.UUID()
			editInput := &models.EditInput{Operation: operation}
			if operation == models.OperationEnumModify {
				editInput.ID = &targetID
			}
			name := s.generateStudioName()
			edit, err := s.resolver.Mutation().StudioEdit(s.ctx, models.StudioEditInput{
				Edit: editInput, Details: &models.StudioEditDetailsInput{Name: &name, ParentID: &parentID},
			})
			require.NoError(t, err)
			network, err := s.createTestStudio(nil)
			require.NoError(t, err)
			networkID := network.UUID()
			_, err = s.resolver.Mutation().StudioUpdate(s.ctx, models.StudioUpdateInput{ID: parentID, ParentID: &networkID})
			require.NoError(t, err)
			applied, err := s.resolver.Mutation().ApproveEdit(s.ctx, models.ApproveEditInput{ID: edit.ID})
			require.NoError(t, err)
			require.Equal(t, models.VoteStatusEnumFailed.String(), applied.Status)
			s.verifyEditApplication(false, applied)
		})
	}
}
