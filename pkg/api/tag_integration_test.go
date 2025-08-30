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

	assert.Assert(s.t, tag.ID != uuid.Nil, "Expected created tag id to be non-zero")
	assert.DeepEqual(s.t, tag.Description, input.Description)
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
	assert.DeepEqual(s.t, tag.Description, input.Description)
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

func (s *tagTestRunner) testQueryTags() {
	// Create test tags
	name1 := s.generateTagName()
	tag1, err := s.createTestTag(&models.TagCreateInput{
		Name: name1,
	})
	assert.NilError(s.t, err)

	name2 := s.generateTagName()
	tag2, err := s.createTestTag(&models.TagCreateInput{
		Name: name2,
	})
	assert.NilError(s.t, err)

	// Test basic query
	result, err := s.client.queryTags(models.TagQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.TagSortEnumName,
	})
	assert.NilError(s.t, err, "Error querying tags")

	// Ensure we have at least the tags we created
	assert.Assert(s.t, result.Count >= 2, "Expected at least 2 tags in count")
	assert.Assert(s.t, len(result.Tags) >= 2, "Expected at least 2 tags in results")

	// Debug: check tag IDs
	s.t.Logf("Looking for tag1 ID: %s, tag2 ID: %s", tag1.ID, tag2.ID)
	s.t.Logf("Query returned %d tags", len(result.Tags))

	// Verify our created tags are in the results
	found1 := false
	found2 := false
	for _, tag := range result.Tags {
		if tag.ID == tag1.ID {
			found1 = true
			assert.Equal(s.t, name1, tag.Name)
		}
		if tag.ID == tag2.ID {
			found2 = true
			assert.Equal(s.t, name2, tag.Name)
		}
	}

	assert.Assert(s.t, found1, "Created tag 1 not found in query results")
	assert.Assert(s.t, found2, "Created tag 2 not found in query results")
}

func (s *tagTestRunner) testFindTagOrAlias() {
	// Create a tag with aliases
	tagName := s.generateTagName()
	alias1 := "alias1-" + tagName
	alias2 := "alias2-" + tagName

	tag, err := s.createTestTag(&models.TagCreateInput{
		Name:    tagName,
		Aliases: []string{alias1, alias2},
	})
	assert.NilError(s.t, err)

	// Test finding by name
	foundByName, err := s.client.findTagOrAlias(tagName)
	assert.NilError(s.t, err, "Error finding tag by name")
	assert.Assert(s.t, foundByName != nil, "Did not find tag by name")
	assert.Equal(s.t, tag.ID, foundByName.ID)

	// Test finding by alias
	foundByAlias, err := s.client.findTagOrAlias(alias1)
	assert.NilError(s.t, err, "Error finding tag by alias")
	assert.Assert(s.t, foundByAlias != nil, "Did not find tag by alias")
	assert.Equal(s.t, tag.ID, foundByAlias.ID)

	// Test not finding non-existent tag/alias
	notFound, err := s.client.findTagOrAlias("non-existent-tag-12345")
	assert.NilError(s.t, err, "Error finding non-existent tag")
	assert.Assert(s.t, notFound == nil, "Found tag that shouldn't exist")
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

func TestQueryTags(t *testing.T) {
	pt := createTagTestRunner(t)
	pt.testQueryTags()
}

func TestFindTagOrAlias(t *testing.T) {
	pt := createTagTestRunner(t)
	pt.testFindTagOrAlias()
}
