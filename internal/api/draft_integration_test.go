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
	hash := models.FingerprintHash(0xabc123def456)
	algorithm := models.FingerprintAlgorithmPhash
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

func (s *draftTestRunner) testSceneDraftTagResolution() {
	// Create three unique tags using the resolver directly
	tag1Name := "Tag One"
	tag1Input := models.TagCreateInput{Name: tag1Name}
	tag1, err := s.resolver.Mutation().TagCreate(s.ctx, tag1Input)
	assert.NoError(s.t, err, "Error creating tag 1")
	tag1ID := tag1.ID

	tag2Name := "Tag Two"
	tag2Input := models.TagCreateInput{Name: tag2Name}
	tag2, err := s.resolver.Mutation().TagCreate(s.ctx, tag2Input)
	assert.NoError(s.t, err, "Error creating tag 2")
	tag2ID := tag2.ID

	tag3Name := "Tag Three"
	tag3Alias := "Tag Three Alias"
	tag3Input := models.TagCreateInput{Name: tag3Name, Aliases: []string{tag3Alias}}
	tag3, err := s.resolver.Mutation().TagCreate(s.ctx, tag3Input)
	assert.NoError(s.t, err, "Error creating tag 3")
	tag3ID := tag3.ID

	// Submit a draft testing all resolution methods
	title := "Scene with Multiple Tags"
	hash := models.FingerprintHash(0x1234567890)
	algorithm := models.FingerprintAlgorithmPhash
	duration := 120
	unmatchedTagName := "Nonexistent Tag"

	draftInput := models.SceneDraftInput{
		Title: &title,
		Fingerprints: []models.FingerprintInput{
			{Hash: hash, Algorithm: algorithm, Duration: duration},
		},
		Performers: []models.DraftEntityInput{},
		Tags: []models.DraftEntityInput{
			{Name: tag1Name},               // Test: exact name match
			{Name: "Ignored", ID: &tag2ID}, // Test: ID match (name ignored)
			{Name: tag3Alias},              // Test: alias match
			{Name: unmatchedTagName},       // Test: non-existent tag
		},
	}

	draft, err := s.client.submitSceneDraft(draftInput)
	assert.NoError(s.t, err, "Error submitting draft")
	assert.NotNil(s.t, draft.UUID(), "Draft UUID should not be nil")

	// Query back and verify all tags
	foundDraft, err := s.client.findDraftWithTags(*draft.UUID())
	assert.NoError(s.t, err, "Error finding draft")
	assert.NotNil(s.t, foundDraft.Data, "Draft data should not be nil")

	draftData := foundDraft.Data.(map[string]interface{})
	tags, ok := draftData["tags"].([]interface{})
	assert.True(s.t, ok, "Tags should be an array")
	assert.Equal(s.t, 4, len(tags), "Should have exactly 4 tags")

	// Verify each tag
	tag1Found := tags[0].(map[string]interface{})
	assert.Equal(s.t, "Tag", tag1Found["__typename"], "Tag 1 should be resolved")
	assert.Equal(s.t, tag1ID.String(), tag1Found["id"], "Tag 1 ID should match")
	assert.Equal(s.t, tag1Name, tag1Found["name"], "Tag 1 name should match")

	tag2Found := tags[1].(map[string]interface{})
	assert.Equal(s.t, "Tag", tag2Found["__typename"], "Tag 2 should be resolved")
	assert.Equal(s.t, tag2ID.String(), tag2Found["id"], "Tag 2 ID should match")
	assert.Equal(s.t, tag2Name, tag2Found["name"], "Tag 2 name should match")

	tag3Found := tags[2].(map[string]interface{})
	assert.Equal(s.t, "Tag", tag3Found["__typename"], "Tag 3 should be resolved")
	assert.Equal(s.t, tag3ID.String(), tag3Found["id"], "Tag 3 ID should match")
	assert.Equal(s.t, tag3Name, tag3Found["name"], "Tag 3 name should match")

	unmatchedFound := tags[3].(map[string]interface{})
	assert.Equal(s.t, "DraftEntity", unmatchedFound["__typename"], "Unmatched tag should be DraftEntity")
	assert.Equal(s.t, unmatchedTagName, unmatchedFound["name"], "Unmatched tag name should match")
}

func TestSceneDraftTagResolution(t *testing.T) {
	pt := createDraftTestRunner(t)
	pt.testSceneDraftTagResolution()
}
