//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
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
