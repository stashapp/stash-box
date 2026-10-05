//go:build integration

package api_test

import (
	"encoding/base64"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/storage"
	"github.com/stretchr/testify/assert"
)

type siteTestRunner struct {
	testRunner
}

func createSiteTestRunner(t *testing.T) *siteTestRunner {
	return &siteTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *siteTestRunner) testCreateSite() {
	description := "Test site description"
	url := "https://example.com"
	regex := `^https://example\.com/.*$`

	input := models.SiteCreateInput{
		Name:        s.generateSiteName(),
		Description: &description,
		URL:         &url,
		Regex:       &regex,
		ValidTypes:  []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene, models.ValidSiteTypeEnumPerformer},
	}

	site, err := s.resolver.Mutation().SiteCreate(s.ctx, input)
	assert.NoError(s.t, err, "Error creating site")

	s.verifyCreatedSite(input, site)
}

func (s *siteTestRunner) verifyCreatedSite(input models.SiteCreateInput, site *models.Site) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, input.Name, site.Name)
	assert.True(s.t, site.ID != uuid.Nil, "Expected created site id to be non-zero")

	// verify optional fields
	if input.Description != nil {
		assert.NotNil(s.t, site.Description, "Expected description to be set")
		assert.Equal(s.t, *input.Description, *site.Description)
	}

	if input.URL != nil {
		assert.NotNil(s.t, site.URL, "Expected URL to be set")
		assert.Equal(s.t, *input.URL, *site.URL)
	}

	if input.Regex != nil {
		assert.NotNil(s.t, site.Regex, "Expected regex to be set")
		assert.Equal(s.t, *input.Regex, *site.Regex)
	}

	// verify valid types
	assert.Equal(s.t, len(input.ValidTypes), len(site.ValidTypes))
}

func (s *siteTestRunner) testFindSiteById() {
	createdSite, err := s.createTestSite(nil)
	assert.NoError(s.t, err)

	siteID := createdSite.ID

	site, err := s.client.findSite(siteID)
	assert.NoError(s.t, err, "Error finding site")

	// ensure returned site is not nil
	assert.NotNil(s.t, site, "Did not find site by id")

	// ensure values were set
	assert.Equal(s.t, createdSite.Name, site.Name)
}

func (s *siteTestRunner) testQuerySites() {
	// Create multiple test sites
	site1, err := s.createTestSite(nil)
	assert.NoError(s.t, err)

	site2, err := s.createTestSite(nil)
	assert.NoError(s.t, err)

	result, err := s.client.querySites()
	assert.NoError(s.t, err, "Error querying sites")

	// ensure we have at least the sites we created
	assert.True(s.t, len(result.Sites) >= 2, "Expected at least 2 sites in query result")

	// verify our created sites are in the results
	found1 := false
	found2 := false
	for _, site := range result.Sites {
		if site.ID == site1.ID.String() {
			found1 = true
		}
		if site.ID == site2.ID.String() {
			found2 = true
		}
	}

	assert.True(s.t, found1, "Created site 1 not found in query results")
	assert.True(s.t, found2, "Created site 2 not found in query results")
}

func (s *siteTestRunner) testUpdateSite() {
	createdSite, err := s.createTestSite(nil)
	assert.NoError(s.t, err)

	siteID := createdSite.ID

	newDescription := "Updated description"
	newURL := "https://updated.com"
	newName := "Updated " + createdSite.Name

	updateInput := models.SiteUpdateInput{
		ID:          siteID,
		Name:        newName,
		Description: &newDescription,
		URL:         &newURL,
		ValidTypes:  []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
	}

	updatedSite, err := s.client.updateSite(updateInput)
	assert.NoError(s.t, err, "Error updating site")

	s.verifyUpdatedSite(updateInput, updatedSite)
}

func (s *siteTestRunner) verifyUpdatedSite(input models.SiteUpdateInput, site *siteOutput) {
	// ensure ID matches
	assert.Equal(s.t, input.ID.String(), site.ID)

	// verify updated fields
	assert.Equal(s.t, input.Name, site.Name)

	if input.Description != nil {
		assert.NotNil(s.t, site.Description, "Expected description to be set")
		assert.Equal(s.t, *input.Description, *site.Description)
	}

	if input.URL != nil {
		assert.NotNil(s.t, site.URL, "Expected URL to be set")
		assert.Equal(s.t, *input.URL, *site.URL)
	}
}

func (s *siteTestRunner) testDestroySite() {
	createdSite, err := s.createTestSite(nil)
	assert.NoError(s.t, err)

	siteID := createdSite.ID

	destroyed, err := s.client.destroySite(models.SiteDestroyInput{
		ID: siteID,
	})
	assert.NoError(s.t, err, "Error destroying site")

	assert.True(s.t, destroyed, "Site was not destroyed")

	// ensure cannot find site
	foundSite, err := s.client.findSite(siteID)
	assert.NoError(s.t, err, "Error finding site after destroying")

	assert.Nil(s.t, foundSite, "Found site after destruction")
}

func (s *siteTestRunner) testSiteCategoryAssignment() {
	category, err := s.createTestSiteCategory(nil)
	assert.NoError(s.t, err)

	// create a site with a category
	createInput := models.SiteCreateInput{
		Name:       s.generateSiteName(),
		ValidTypes: []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
		CategoryID: &category.ID,
	}
	site, err := s.resolver.Mutation().SiteCreate(s.ctx, createInput)
	assert.NoError(s.t, err, "Error creating site with category")
	assert.Equal(s.t, category.ID, *site.CategoryID)

	resolvedCategory, err := s.resolver.Site().Category(s.ctx, site)
	assert.NoError(s.t, err, "Error resolving site category")
	assert.NotNil(s.t, resolvedCategory, "Expected site category to resolve")
	assert.Equal(s.t, category.Name, resolvedCategory.Name)

	// update to a different category
	newCategory, err := s.createTestSiteCategory(nil)
	assert.NoError(s.t, err)

	site, err = s.resolver.Mutation().SiteUpdate(s.ctx, models.SiteUpdateInput{
		ID:         site.ID,
		Name:       site.Name,
		ValidTypes: []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
		CategoryID: &newCategory.ID,
	})
	assert.NoError(s.t, err, "Error updating site category")
	assert.Equal(s.t, newCategory.ID, *site.CategoryID)

	// update omitting the category clears it
	site, err = s.resolver.Mutation().SiteUpdate(s.ctx, models.SiteUpdateInput{
		ID:         site.ID,
		Name:       site.Name,
		ValidTypes: []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
	})
	assert.NoError(s.t, err, "Error clearing site category")
	assert.Nil(s.t, site.CategoryID, "Expected site category to be cleared")
}

func (s *siteTestRunner) testSiteHighlighted() {
	site, err := s.createTestSite(&models.SiteCreateInput{
		Name:        s.generateSiteName(),
		ValidTypes:  []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
		Highlighted: false,
	})
	assert.NoError(s.t, err)
	assert.False(s.t, site.Highlighted, "Expected highlighted to be false")

	// update toggles it on
	site, err = s.resolver.Mutation().SiteUpdate(s.ctx, models.SiteUpdateInput{
		ID:          site.ID,
		Name:        site.Name,
		ValidTypes:  []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
		Highlighted: true,
	})
	assert.NoError(s.t, err, "Error updating site highlighted")
	assert.True(s.t, site.Highlighted, "Expected highlighted to be true after update")
}

func (s *siteTestRunner) testDestroySiteCategoryUnsetsSites() {
	category, err := s.createTestSiteCategory(nil)
	assert.NoError(s.t, err)

	site, err := s.createTestSite(&models.SiteCreateInput{
		Name:       s.generateSiteName(),
		ValidTypes: []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
		CategoryID: &category.ID,
	})
	assert.NoError(s.t, err)
	assert.NotNil(s.t, site.CategoryID)

	destroyed, err := s.resolver.Mutation().SiteCategoryDestroy(s.ctx, models.SiteCategoryDestroyInput{
		ID: category.ID,
	})
	assert.NoError(s.t, err, "Error destroying referenced site category")
	assert.True(s.t, destroyed)

	foundSite, err := s.resolver.Query().FindSite(s.ctx, site.ID)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, foundSite)
	assert.Nil(s.t, foundSite.CategoryID, "Expected site category to be unset after category destruction")
}

func (s *siteTestRunner) testSiteFavicon() {
	// Point favicon storage at a temp dir for the duration of the test.
	prevPath := config.C.FaviconPath
	config.C.FaviconPath = s.t.TempDir()
	defer func() { config.C.FaviconPath = prevPath }()

	iconBytes := []byte("fake-favicon-bytes")
	dataURL := "data:image/png;base64," + base64.StdEncoding.EncodeToString(iconBytes)

	site, err := s.createTestSite(&models.SiteCreateInput{
		Name:       s.generateSiteName(),
		ValidTypes: []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
		Favicon:    &dataURL,
	})
	assert.NoError(s.t, err)

	stored, err := storage.GetSiteIcon(s.ctx, *site)
	assert.NoError(s.t, err)
	assert.Equal(s.t, iconBytes, stored, "Expected stored favicon to match input")

	// Updating without a favicon leaves it unchanged.
	_, err = s.resolver.Mutation().SiteUpdate(s.ctx, models.SiteUpdateInput{
		ID:         site.ID,
		Name:       site.Name,
		ValidTypes: []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
	})
	assert.NoError(s.t, err)
	stored, err = storage.GetSiteIcon(s.ctx, *site)
	assert.NoError(s.t, err)
	assert.Equal(s.t, iconBytes, stored, "Expected favicon to be unchanged")

	// Updating with an empty favicon clears it.
	empty := ""
	_, err = s.resolver.Mutation().SiteUpdate(s.ctx, models.SiteUpdateInput{
		ID:         site.ID,
		Name:       site.Name,
		ValidTypes: []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
		Favicon:    &empty,
	})
	assert.NoError(s.t, err)
	stored, err = storage.GetSiteIcon(s.ctx, *site)
	assert.NoError(s.t, err)
	assert.Nil(s.t, stored, "Expected favicon to be cleared")
}

func TestCreateSite(t *testing.T) {
	st := createSiteTestRunner(t)
	st.testCreateSite()
}

func TestFindSiteById(t *testing.T) {
	st := createSiteTestRunner(t)
	st.testFindSiteById()
}

func TestQuerySites(t *testing.T) {
	st := createSiteTestRunner(t)
	st.testQuerySites()
}

func TestUpdateSite(t *testing.T) {
	st := createSiteTestRunner(t)
	st.testUpdateSite()
}

func TestDestroySite(t *testing.T) {
	st := createSiteTestRunner(t)
	st.testDestroySite()
}

func TestSiteHighlighted(t *testing.T) {
	st := createSiteTestRunner(t)
	st.testSiteHighlighted()
}

func TestSiteCategoryAssignment(t *testing.T) {
	st := createSiteTestRunner(t)
	st.testSiteCategoryAssignment()
}

func TestDestroySiteCategoryUnsetsSites(t *testing.T) {
	st := createSiteTestRunner(t)
	st.testDestroySiteCategoryUnsetsSites()
}

func TestSiteFavicon(t *testing.T) {
	st := createSiteTestRunner(t)
	st.testSiteFavicon()
}
