//go:build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type siteCategoryTestRunner struct {
	testRunner
}

func createSiteCategoryTestRunner(t *testing.T) *siteCategoryTestRunner {
	return &siteCategoryTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *siteCategoryTestRunner) testCreateSiteCategory() {
	description := "Description"
	sortOrder := 5

	input := models.SiteCategoryCreateInput{
		Name:        s.generateSiteCategoryName(),
		Description: &description,
		SortOrder:   &sortOrder,
	}

	category, err := s.resolver.Mutation().SiteCategoryCreate(s.ctx, input)
	assert.NoError(s.t, err, "Error creating siteCategory")

	assert.True(s.t, category.ID != 0, "Expected created siteCategory id to be non-zero")
	assert.Equal(s.t, input.Name, category.Name)
	assert.Equal(s.t, input.Description, category.Description)
	assert.Equal(s.t, sortOrder, category.SortOrder)
}

func (s *siteCategoryTestRunner) testFindSiteCategoryById() {
	createdCategory, err := s.createTestSiteCategory(nil)
	assert.NoError(s.t, err)

	category, err := s.resolver.Query().FindSiteCategory(s.ctx, createdCategory.ID)
	assert.NoError(s.t, err, "Error finding siteCategory")

	assert.NotNil(s.t, category, "Did not find siteCategory by id")
	assert.Equal(s.t, createdCategory.Name, category.Name)
}

func (s *siteCategoryTestRunner) testUpdateSiteCategory() {
	createdCategory, err := s.createTestSiteCategory(nil)
	assert.NoError(s.t, err)

	newDescription := "newDescription"
	newSortOrder := 10

	updateInput := models.SiteCategoryUpdateInput{
		ID:          createdCategory.ID,
		Description: &newDescription,
		SortOrder:   &newSortOrder,
	}

	updatedCategory, err := s.resolver.Mutation().SiteCategoryUpdate(s.ctx, updateInput)
	assert.NoError(s.t, err, "Error updating siteCategory")

	// name was omitted from the input, so it must be unchanged
	assert.Equal(s.t, createdCategory.Name, updatedCategory.Name)
	assert.Equal(s.t, updateInput.Description, updatedCategory.Description)
	assert.Equal(s.t, newSortOrder, updatedCategory.SortOrder)
}

func (s *siteCategoryTestRunner) testDestroySiteCategory() {
	createdCategory, err := s.createTestSiteCategory(nil)
	assert.NoError(s.t, err)

	destroyed, err := s.resolver.Mutation().SiteCategoryDestroy(s.ctx, models.SiteCategoryDestroyInput{
		ID: createdCategory.ID,
	})
	assert.NoError(s.t, err, "Error destroying siteCategory")

	assert.True(s.t, destroyed, "SiteCategory was not destroyed")

	foundCategory, err := s.resolver.Query().FindSiteCategory(s.ctx, createdCategory.ID)
	assert.NoError(s.t, err, "Error finding siteCategory after destroying")

	assert.Nil(s.t, foundCategory, "Found siteCategory after destruction")
}

func (s *siteCategoryTestRunner) testQuerySiteCategories() {
	cat1, err := s.createTestSiteCategory(nil)
	assert.NoError(s.t, err)

	cat2, err := s.createTestSiteCategory(nil)
	assert.NoError(s.t, err)

	result, err := s.client.querySiteCategories()
	assert.NoError(s.t, err, "Error querying site categories")

	assert.True(s.t, result.Count >= 2, "Expected at least 2 site categories in count")
	assert.True(s.t, len(result.SiteCategories) >= 2, "Expected at least 2 site categories in results")

	found1 := false
	found2 := false
	for _, sc := range result.SiteCategories {
		if sc.ID == cat1.ID {
			found1 = true
			assert.Equal(s.t, cat1.Name, sc.Name)
		}
		if sc.ID == cat2.ID {
			found2 = true
			assert.Equal(s.t, cat2.Name, sc.Name)
		}
	}

	assert.True(s.t, found1, "Created site category 1 not found in query results")
	assert.True(s.t, found2, "Created site category 2 not found in query results")
}

func TestCreateSiteCategory(t *testing.T) {
	pt := createSiteCategoryTestRunner(t)
	pt.testCreateSiteCategory()
}

func TestFindSiteCategoryById(t *testing.T) {
	pt := createSiteCategoryTestRunner(t)
	pt.testFindSiteCategoryById()
}

func TestUpdateSiteCategory(t *testing.T) {
	pt := createSiteCategoryTestRunner(t)
	pt.testUpdateSiteCategory()
}

func TestDestroySiteCategory(t *testing.T) {
	pt := createSiteCategoryTestRunner(t)
	pt.testDestroySiteCategory()
}

func TestQuerySiteCategories(t *testing.T) {
	pt := createSiteCategoryTestRunner(t)
	pt.testQuerySiteCategories()
}
