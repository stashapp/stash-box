//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
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
		Urls: []*models.URLInput{
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
		Tattoos: []*models.BodyModificationInput{
			{
				Location:    "Inner thigh",
				Description: &tattooDesc,
			},
		},
		Piercings: []*models.BodyModificationInput{
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

	disambiguation, _ := r.Disambiguation(s.ctx, performer)
	assert.DeepEqual(s.t, disambiguation, input.Disambiguation)

	alias, _ := r.Aliases(s.ctx, performer)
	assert.DeepEqual(s.t, alias, input.Aliases)

	gender, _ := r.Gender(s.ctx, performer)
	assert.DeepEqual(s.t, gender, input.Gender)

	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	assert.Assert(s.t, compareUrls(input.Urls, urls), "Urls")

	birthdate, _ := r.BirthDate(s.ctx, performer)
	assert.DeepEqual(s.t, birthdate, input.Birthdate)

	deathdate, _ := r.DeathDate(s.ctx, performer)
	assert.DeepEqual(s.t, deathdate, input.Deathdate)

	ethnicity, _ := r.Ethnicity(s.ctx, performer)
	assert.DeepEqual(s.t, ethnicity, input.Ethnicity)

	country, _ := r.Country(s.ctx, performer)
	assert.DeepEqual(s.t, country, input.Country)

	eyeColor, _ := r.EyeColor(s.ctx, performer)
	assert.DeepEqual(s.t, eyeColor, input.EyeColor)

	p, _ := r.HairColor(s.ctx, performer)
	assert.DeepEqual(s.t, p, input.HairColor)

	height, _ := r.Height(s.ctx, performer)
	assert.DeepEqual(s.t, height, input.Height)

	cupSize, _ := r.CupSize(s.ctx, performer)
	assert.DeepEqual(s.t, cupSize, input.CupSize)

	bandSize, _ := r.BandSize(s.ctx, performer)
	assert.DeepEqual(s.t, bandSize, input.BandSize)

	waistSize, _ := r.WaistSize(s.ctx, performer)
	assert.DeepEqual(s.t, waistSize, input.WaistSize)

	hipSize, _ := r.HipSize(s.ctx, performer)
	assert.DeepEqual(s.t, hipSize, input.HipSize)

	breastType, _ := r.BreastType(s.ctx, performer)
	assert.DeepEqual(s.t, breastType, input.BreastType)

	careerStartYear, _ := r.CareerStartYear(s.ctx, performer)
	assert.DeepEqual(s.t, careerStartYear, input.CareerStartYear)

	careerEndYear, _ := r.CareerEndYear(s.ctx, performer)
	assert.DeepEqual(s.t, careerEndYear, input.CareerEndYear)

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
		Urls: []*models.URLInput{
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
		Tattoos: []*models.BodyModificationInput{
			{
				Location:    "Inner thigh",
				Description: &tattooDesc,
			},
		},
		Piercings: []*models.BodyModificationInput{
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
		Urls: []*models.URLInput{
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
		Tattoos: []*models.BodyModificationInput{
			{
				Location:    "Tramp stamp",
				Description: &tattooDesc,
			},
		},
		Piercings: []*models.BodyModificationInput{
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
	assert.Assert(s.t, compareUrls(input.Urls, urls))

	birthdate, _ := s.resolver.Performer().BirthDate(s.ctx, performer)
	assert.DeepEqual(s.t, birthdate, input.Birthdate)

	deathdate, _ := s.resolver.Performer().DeathDate(s.ctx, performer)
	assert.DeepEqual(s.t, deathdate, input.Deathdate)

	tattoos, _ := s.resolver.Performer().Tattoos(s.ctx, performer)
	assert.Assert(s.t, compareBodyMods(input.Tattoos, tattoos))

	piercings, _ := s.resolver.Performer().Piercings(s.ctx, performer)
	assert.Assert(s.t, compareBodyMods(input.Piercings, piercings))

	cupSize, _ := s.resolver.Performer().CupSize(s.ctx, performer)
	assert.DeepEqual(s.t, cupSize, input.CupSize)

	bandSize, _ := s.resolver.Performer().BandSize(s.ctx, performer)
	assert.DeepEqual(s.t, bandSize, input.BandSize)

	waistSize, _ := s.resolver.Performer().WaistSize(s.ctx, performer)
	assert.DeepEqual(s.t, waistSize, input.WaistSize)

	hipSize, _ := s.resolver.Performer().HipSize(s.ctx, performer)
	assert.DeepEqual(s.t, hipSize, input.HipSize)
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
