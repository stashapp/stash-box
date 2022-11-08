//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"gotest.tools/v3/assert"
)

type tagTestRunner struct {
	testRunner
}

func createTagTestRunner(t *testing.T) *tagTestRunner {
	return &tagTestRunner{
		testRunner: *asModify(t),
	}
}

func (s *tagTestRunner) testCreateTag() {
	description := "Description"

	input := models.TagCreateInput{
		Name:        s.generateTagName(),
		Description: &description,
	}

	tag, err := s.resolver.Mutation().TagCreate(s.ctx, input)
	assert.NilError(s.t, err, "Error creating tag")

	s.verifyCreatedTag(input, tag)
}

func (s *tagTestRunner) verifyCreatedTag(input models.TagCreateInput, tag *models.Tag) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, input.Name, tag.Name)

	r := s.resolver.Tag()

	assert.Assert(s.t, tag.ID != uuid.Nil, "Expected created tag id to be non-zero")

	description, _ := r.Description(s.ctx, tag)
	assert.DeepEqual(s.t, description, input.Description)
}

func (s *tagTestRunner) testFindTagById() {
	createdTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	tagID := createdTag.UUID()
	tag, err := s.resolver.Query().FindTag(s.ctx, &tagID, nil)
	assert.NilError(s.t, err, "Error finding tag")

	// ensure returned tag is not nil
	assert.Assert(s.t, tag != nil, "Did not find tag by id")

	// ensure values were set
	assert.Equal(s.t, createdTag.Name, tag.Name)
}

func (s *tagTestRunner) testFindTagByName() {
	createdTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	tagName := createdTag.Name

	tag, err := s.resolver.Query().FindTag(s.ctx, nil, &tagName)
	assert.NilError(s.t, err, "Error finding tag")

	// ensure returned tag is not nil
	assert.Assert(s.t, tag != nil, "Did not find tag by name")

	// ensure values were set
	assert.Equal(s.t, createdTag.Name, tag.Name)
}

func (s *tagTestRunner) testUpdateTag() {
	createdTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	tagID := createdTag.UUID()

	newDescription := "newDescription"

	updateInput := models.TagUpdateInput{
		ID:          tagID,
		Description: &newDescription,
	}

	updatedTag, err := s.resolver.Mutation().TagUpdate(s.ctx, updateInput)
	assert.NilError(s.t, err, "Error updating tag")

	updateInput.Name = &createdTag.Name
	s.verifyUpdatedTag(updateInput, updatedTag)
}

func (s *tagTestRunner) verifyUpdatedTag(input models.TagUpdateInput, tag *models.Tag) {
	// ensure basic attributes are set correctly
	assert.Assert(s.t, input.Name == nil || (*input.Name == tag.Name))

	r := s.resolver.Tag()

	description, _ := r.Description(s.ctx, tag)
	assert.DeepEqual(s.t, description, input.Description)
}

func (s *tagTestRunner) testDestroyTag() {
	createdTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	tagID := createdTag.UUID()

	destroyed, err := s.resolver.Mutation().TagDestroy(s.ctx, models.TagDestroyInput{
		ID: tagID,
	})
	assert.NilError(s.t, err, "Error destroying tag")

	assert.Assert(s.t, destroyed, "Tag was not destroyed")

	// ensure cannot find tag
	foundTag, err := s.resolver.Query().FindTag(s.ctx, &tagID, nil)
	assert.NilError(s.t, err, "Error finding tag after destroying")

	assert.Assert(s.t, foundTag == nil, "Found tag after destruction")

	// TODO - ensure scene was not removed
}

func TestCreateTag(t *testing.T) {
	pt := createTagTestRunner(t)
	pt.testCreateTag()
}

func TestFindTagById(t *testing.T) {
	pt := createTagTestRunner(t)
	pt.testFindTagById()
}

func TestFindTagByName(t *testing.T) {
	pt := createTagTestRunner(t)
	pt.testFindTagByName()
}

func TestUpdateTag(t *testing.T) {
	pt := createTagTestRunner(t)
	pt.testUpdateTag()
}

func TestDestroyTag(t *testing.T) {
	pt := createTagTestRunner(t)
	pt.testDestroyTag()
}
