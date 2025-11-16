//go:build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type draftTestRunner struct {
	testRunner
}

func createDraftTestRunner(t *testing.T) *draftTestRunner {
	return &draftTestRunner{
		testRunner: *asEdit(t),
	}
}

func (s *draftTestRunner) testSubmitSceneDraft() {
	title := "Test Scene Draft"
	hash := "abc123def456"
	algorithm := models.FingerprintAlgorithmMd5
	duration := 180

	input := models.SceneDraftInput{
		Title: &title,
		Fingerprints: []models.FingerprintInput{
			{
				Hash:      hash,
				Algorithm: algorithm,
				Duration:  duration,
			},
		},
		Performers: []models.DraftEntityInput{
			{
				Name: "Test Performer",
			},
		},
	}

	result, err := s.client.submitSceneDraft(input)
	assert.NoError(s.t, err, "Error submitting scene draft")
	assert.NotNil(s.t, result, "Result should not be nil")
	assert.NotNil(s.t, result.ID, "Draft ID should not be nil")
	assert.NotNil(s.t, result.UUID(), "Draft UUID should not be nil")
}

func (s *draftTestRunner) testSubmitPerformerDraft() {
	name := "Test Performer Draft"
	gender := "Female"
	country := "US"

	input := models.PerformerDraftInput{
		Name:    name,
		Gender:  &gender,
		Country: &country,
	}

	result, err := s.client.submitPerformerDraft(input)
	assert.NoError(s.t, err, "Error submitting performer draft")
	assert.NotNil(s.t, result, "Result should not be nil")
	assert.NotNil(s.t, result.ID, "Draft ID should not be nil")
	assert.NotNil(s.t, result.UUID(), "Draft UUID should not be nil")
}

func (s *draftTestRunner) testFindDraft() {
	// Create a draft first
	name := "Test Performer for Find"
	input := models.PerformerDraftInput{
		Name: name,
	}

	result, err := s.client.submitPerformerDraft(input)
	assert.NoError(s.t, err, "Error submitting performer draft")
	assert.NotNil(s.t, result.UUID(), "Draft UUID should not be nil")

	draftID := *result.UUID()

	// Find the draft
	foundDraft, err := s.client.findDraft(draftID)
	assert.NoError(s.t, err, "Error finding draft")
	assert.NotNil(s.t, foundDraft, "Found draft should not be nil")
	assert.Equal(s.t, draftID.String(), foundDraft.ID, "Draft ID should match")
}

func (s *draftTestRunner) testFindDrafts() {
	// Create multiple drafts
	name1 := "Test Performer 1"
	input1 := models.PerformerDraftInput{
		Name: name1,
	}
	result1, err := s.client.submitPerformerDraft(input1)
	assert.NoError(s.t, err, "Error submitting first performer draft")

	name2 := "Test Performer 2"
	input2 := models.PerformerDraftInput{
		Name: name2,
	}
	result2, err := s.client.submitPerformerDraft(input2)
	assert.NoError(s.t, err, "Error submitting second performer draft")

	// Find all drafts
	drafts, err := s.client.findDrafts()
	assert.NoError(s.t, err, "Error finding drafts")
	assert.NotNil(s.t, drafts, "Drafts should not be nil")
	assert.True(s.t, len(drafts) >= 2, "Should have at least 2 drafts")

	// Verify our created drafts are in the results
	foundDraft1 := false
	foundDraft2 := false
	for _, draft := range drafts {
		if draft.ID == result1.UUID().String() {
			foundDraft1 = true
		}
		if draft.ID == result2.UUID().String() {
			foundDraft2 = true
		}
	}
	assert.True(s.t, foundDraft1, "First draft should be found")
	assert.True(s.t, foundDraft2, "Second draft should be found")
}

func (s *draftTestRunner) testDestroyDraft() {
	// Create a draft first
	name := "Test Performer for Destroy"
	input := models.PerformerDraftInput{
		Name: name,
	}

	result, err := s.client.submitPerformerDraft(input)
	assert.NoError(s.t, err, "Error submitting performer draft")
	assert.NotNil(s.t, result.UUID(), "Draft UUID should not be nil")

	draftID := *result.UUID()

	// Destroy the draft
	destroyed, err := s.client.destroyDraft(draftID)
	assert.NoError(s.t, err, "Error destroying draft")
	assert.True(s.t, destroyed, "Draft should be destroyed")

	// Verify draft is no longer found
	foundDraft, err := s.client.findDraft(draftID)
	// Should return an error since the draft doesn't exist
	assert.NotNil(s.t, err, "Should return error when finding destroyed draft")
	assert.Nil(s.t, foundDraft, "Found draft should be nil after destruction")
}

func TestSubmitSceneDraft(t *testing.T) {
	pt := createDraftTestRunner(t)
	pt.testSubmitSceneDraft()
}

func TestSubmitPerformerDraft(t *testing.T) {
	pt := createDraftTestRunner(t)
	pt.testSubmitPerformerDraft()
}

func TestFindDraft(t *testing.T) {
	pt := createDraftTestRunner(t)
	pt.testFindDraft()
}

func TestFindDrafts(t *testing.T) {
	pt := createDraftTestRunner(t)
	pt.testFindDrafts()
}

func TestDestroyDraft(t *testing.T) {
	pt := createDraftTestRunner(t)
	pt.testDestroyDraft()
}
