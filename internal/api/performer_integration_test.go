//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"gotest.tools/v3/assert"
)

type performerTestRunner struct {
	testRunner
}

func createPerformerTestRunner(t *testing.T) *performerTestRunner {
	return &performerTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *performerTestRunner) testCreatePerformer() {
	disambiguation := "Disambiguation"
	country := "USA"
	height := 182
	cupSize := "C"
	bandSize := 32
	careerStartYear := 2000
	tattooDesc := "Foobar"
	gender := models.GenderEnumFemale
	ethnicity := models.EthnicityEnumCaucasian
	eyeColor := models.EyeColorEnumBlue
	hairColor := models.HairColorEnumBlonde
	breastType := models.BreastTypeEnumNatural
	birthdate := "2001-02-03"
	deathdate := "2024-12-23"
	site, err := s.createTestSite(nil)
	assert.NilError(s.t, err)

	input := models.PerformerCreateInput{
		Name:           s.generatePerformerName(),
		Disambiguation: &disambiguation,
		Aliases:        []string{"Alias1", "Alias2"},
		Gender:         &gender,
		Urls: []models.URL{
			{
				URL:    "URL",
				SiteID: site.ID,
			},
		},
		Birthdate:       &birthdate,
		Deathdate:       &deathdate,
		Ethnicity:       &ethnicity,
		Country:         &country,
		EyeColor:        &eyeColor,
		HairColor:       &hairColor,
		Height:          &height,
		CupSize:         &cupSize,
		BandSize:        &bandSize,
		WaistSize:       &bandSize,
		HipSize:         &bandSize,
		BreastType:      &breastType,
		CareerStartYear: &careerStartYear,
		CareerEndYear:   nil,
		Tattoos: []models.BodyModificationInput{
			{
				Location:    "Inner thigh",
				Description: &tattooDesc,
			},
		},
		Piercings: []models.BodyModificationInput{
			{
				Location:    "Nose",
				Description: nil,
			},
		},
	}

	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, input)
	assert.NilError(s.t, err)

	s.verifyCreatedPerformer(input, performer)
}

func (s *performerTestRunner) verifyCreatedPerformer(input models.PerformerCreateInput, performer *models.Performer) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, input.Name, performer.Name)

	r := s.resolver.Performer()

	assert.Assert(s.t, performer.ID != uuid.Nil, "Expected created performer id to be non-zero")

	assert.DeepEqual(s.t, performer.Disambiguation, input.Disambiguation)

	alias, _ := r.Aliases(s.ctx, performer)
	assert.DeepEqual(s.t, alias, input.Aliases)

	assert.DeepEqual(s.t, performer.Gender, input.Gender)

	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	assert.DeepEqual(s.t, input.Urls, urls)

	birthdate, _ := r.Birthdate(s.ctx, performer)
	if input.Birthdate == nil {
		assert.Assert(s.t, birthdate == nil)
	} else {
		assert.Equal(s.t, *input.Birthdate, birthdate.Date)
	}

	assert.DeepEqual(s.t, performer.DeathDate, input.Deathdate)

	assert.DeepEqual(s.t, performer.Ethnicity, input.Ethnicity)

	assert.DeepEqual(s.t, performer.Country, input.Country)

	assert.DeepEqual(s.t, performer.EyeColor, input.EyeColor)

	assert.DeepEqual(s.t, performer.HairColor, input.HairColor)

	assert.DeepEqual(s.t, performer.Height, input.Height)

	assert.DeepEqual(s.t, performer.CupSize, input.CupSize)

	assert.DeepEqual(s.t, performer.BandSize, input.BandSize)

	assert.DeepEqual(s.t, performer.WaistSize, input.WaistSize)

	assert.DeepEqual(s.t, performer.HipSize, input.HipSize)

	assert.DeepEqual(s.t, performer.BreastType, input.BreastType)

	assert.DeepEqual(s.t, performer.CareerStartYear, input.CareerStartYear)

	assert.DeepEqual(s.t, performer.CareerEndYear, input.CareerEndYear)

	tattoos, _ := s.resolver.Performer().Tattoos(s.ctx, performer)
	assert.Assert(s.t, compareBodyMods(input.Tattoos, tattoos))

	piercings, _ := s.resolver.Performer().Piercings(s.ctx, performer)
	assert.Assert(s.t, compareBodyMods(input.Piercings, piercings))
}

func (s *performerTestRunner) testFindPerformer() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	performer, err := s.resolver.Query().FindPerformer(s.ctx, createdPerformer.UUID())
	assert.NilError(s.t, err, "Error finding performer")

	assert.Assert(s.t, performer != nil, "Did not find performer by id")

	// ensure values were set
	assert.Equal(s.t, createdPerformer.Name, performer.Name)
}

func (s *performerTestRunner) testUpdatePerformer() {
	cupSize := "C"
	bandSize := 32
	tattooDesc := "Foobar"
	date := "2001-02-03"
	deathdate := "2024-11-23"
	site, err := s.createTestSite(nil)
	assert.NilError(s.t, err)

	input := &models.PerformerCreateInput{
		Name:    s.generatePerformerName(),
		Aliases: []string{"Alias1", "Alias2"},
		Urls: []models.URL{
			{
				URL:    "URL",
				SiteID: site.ID,
			},
		},
		Birthdate: &date,
		Deathdate: &deathdate,
		CupSize:   &cupSize,
		BandSize:  &bandSize,
		WaistSize: &bandSize,
		HipSize:   &bandSize,
		Tattoos: []models.BodyModificationInput{
			{
				Location:    "Inner thigh",
				Description: &tattooDesc,
			},
		},
		Piercings: []models.BodyModificationInput{
			{
				Location:    "Nose",
				Description: nil,
			},
		},
	}

	createdPerformer, err := s.createTestPerformer(input)
	assert.NilError(s.t, err)

	performerID := createdPerformer.UUID()

	updateInput := models.PerformerUpdateInput{
		ID:      performerID,
		Aliases: []string{"Alias3", "Alias4"},
		Urls: []models.URL{
			{
				URL:    "URL",
				SiteID: site.ID,
			},
		},
		Birthdate: &date,
		Deathdate: &deathdate,
		CupSize:   &cupSize,
		BandSize:  &bandSize,
		WaistSize: &bandSize,
		HipSize:   &bandSize,
		Tattoos: []models.BodyModificationInput{
			{
				Location:    "Tramp stamp",
				Description: &tattooDesc,
			},
		},
		Piercings: []models.BodyModificationInput{
			{
				Location:    "Navel",
				Description: nil,
			},
		},
	}

	// need some mocking of the context to make the field ignore behaviour work
	ctx := s.updateContext([]string{
		"aliases",
		"urls",
		"birthdate",
		"deathdate",
		"tattoos",
		"piercings",
		"cup_size",
		"band_size",
		"waist_size",
		"hip_size",
	})

	updatedPerformer, err := s.resolver.Mutation().PerformerUpdate(ctx, updateInput)
	assert.NilError(s.t, err)

	s.verifyUpdatedPerformer(updateInput, updatedPerformer)
}

func (s *performerTestRunner) verifyUpdatedPerformer(input models.PerformerUpdateInput, performer *models.Performer) {
	// ensure basic attributes are set correctly
	assert.Assert(s.t, input.Name == nil || *input.Name == performer.Name)

	r := s.resolver.Performer()

	aliases, _ := r.Aliases(s.ctx, performer)
	assert.DeepEqual(s.t, aliases, input.Aliases)

	// ensure urls were set correctly
	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	assert.DeepEqual(s.t, input.Urls, urls)

	birthdate, _ := s.resolver.Performer().Birthdate(s.ctx, performer)
	if input.Birthdate == nil {
		assert.Assert(s.t, birthdate == nil)
	} else {
		assert.Equal(s.t, *input.Birthdate, birthdate.Date)
	}

	assert.DeepEqual(s.t, performer.DeathDate, input.Deathdate)

	tattoos, _ := s.resolver.Performer().Tattoos(s.ctx, performer)
	assert.Assert(s.t, compareBodyMods(input.Tattoos, tattoos))

	piercings, _ := s.resolver.Performer().Piercings(s.ctx, performer)
	assert.Assert(s.t, compareBodyMods(input.Piercings, piercings))

	assert.DeepEqual(s.t, performer.CupSize, input.CupSize)

	assert.DeepEqual(s.t, performer.BandSize, input.BandSize)

	assert.DeepEqual(s.t, performer.WaistSize, input.WaistSize)

	assert.DeepEqual(s.t, performer.HipSize, input.HipSize)
}

func (s *performerTestRunner) testDestroyPerformer() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	performerID := createdPerformer.UUID()

	destroyed, err := s.resolver.Mutation().PerformerDestroy(s.ctx, models.PerformerDestroyInput{
		ID: performerID,
	})
	assert.NilError(s.t, err, "Error destroying performer")
	assert.Assert(s.t, destroyed, "Performer was not destroyed")

	// ensure cannot find performer
	foundPerformer, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NilError(s.t, err)

	assert.Assert(s.t, foundPerformer == nil, "Found performer after destruction")

	// TODO - ensure scene was not removed
}

func (s *performerTestRunner) testQueryPerformers() {
	// Create test performers with specific attributes
	name1 := s.generatePerformerName()
	performer1, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: name1,
	})
	assert.NilError(s.t, err)

	name2 := s.generatePerformerName()
	performer2, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: name2,
	})
	assert.NilError(s.t, err)

	// Test basic query
	result, err := s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   25,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NilError(s.t, err, "Error querying performers")

	// Ensure we have at least the performers we created
	assert.Assert(s.t, result.Count >= 2, "Expected at least 2 performers in count")
	assert.Assert(s.t, len(result.Performers) >= 2, "Expected at least 2 performers in results")

	// Verify our created performers are in the results
	found1 := false
	found2 := false
	for _, p := range result.Performers {
		if p.ID == performer1.ID {
			found1 = true
			assert.Equal(s.t, name1, p.Name)
		}
		if p.ID == performer2.ID {
			found2 = true
			assert.Equal(s.t, name2, p.Name)
		}
	}

	assert.Assert(s.t, found1, "Created performer 1 not found in query results")
	assert.Assert(s.t, found2, "Created performer 2 not found in query results")
}

func TestCreatePerformer(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testCreatePerformer()
}

func TestFindPerformer(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testFindPerformer()
}

func TestUpdatePerformer(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testUpdatePerformer()
}

// TestUpdatePerformerName is removed due to no longer allowing
// partial updates

func TestDestroyPerformer(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testDestroyPerformer()
}

func TestQueryPerformers(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testQueryPerformers()
}
