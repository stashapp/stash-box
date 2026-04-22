//go:build integration

package api_test

import (
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
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
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	s.verifyCreatedPerformer(input, performer)
}

func (s *performerTestRunner) verifyCreatedPerformer(input models.PerformerCreateInput, performer *models.Performer) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, input.Name, performer.Name)

	r := s.resolver.Performer()

	assert.True(s.t, performer.ID != uuid.Nil, "Expected created performer id to be non-zero")

	assert.Equal(s.t, performer.Disambiguation, input.Disambiguation)

	alias, _ := r.Aliases(s.ctx, performer)
	assert.Equal(s.t, alias, input.Aliases)

	assert.Equal(s.t, performer.Gender, input.Gender)

	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	assert.Equal(s.t, input.Urls, urls)

	birthdate, _ := r.Birthdate(s.ctx, performer)
	if input.Birthdate == nil {
		assert.Nil(s.t, birthdate)
	} else {
		assert.Equal(s.t, *input.Birthdate, birthdate.Date)
	}

	assert.Equal(s.t, performer.DeathDate, input.Deathdate)

	assert.Equal(s.t, performer.Ethnicity, input.Ethnicity)

	assert.Equal(s.t, performer.Country, input.Country)

	assert.Equal(s.t, performer.EyeColor, input.EyeColor)

	assert.Equal(s.t, performer.HairColor, input.HairColor)

	assert.Equal(s.t, performer.Height, input.Height)

	assert.Equal(s.t, performer.CupSize, input.CupSize)

	assert.Equal(s.t, performer.BandSize, input.BandSize)

	assert.Equal(s.t, performer.WaistSize, input.WaistSize)

	assert.Equal(s.t, performer.HipSize, input.HipSize)

	assert.Equal(s.t, performer.BreastType, input.BreastType)

	assert.Equal(s.t, performer.CareerStartYear, input.CareerStartYear)

	assert.Equal(s.t, performer.CareerEndYear, input.CareerEndYear)

	tattoos, _ := s.resolver.Performer().Tattoos(s.ctx, performer)
	assertBodyMods(s.t, input.Tattoos, tattoos, "Tattoos should match")

	piercings, _ := s.resolver.Performer().Piercings(s.ctx, performer)
	assertBodyMods(s.t, input.Piercings, piercings, "Piercings should match")
}

func (s *performerTestRunner) testFindPerformer() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	performer, err := s.resolver.Query().FindPerformer(s.ctx, createdPerformer.UUID())
	assert.NoError(s.t, err, "Error finding performer")

	assert.NotNil(s.t, performer, "Did not find performer by id")

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
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	s.verifyUpdatedPerformer(updateInput, updatedPerformer)
}

func (s *performerTestRunner) verifyUpdatedPerformer(input models.PerformerUpdateInput, performer *models.Performer) {
	// ensure basic attributes are set correctly
	assert.True(s.t, input.Name == nil || *input.Name == performer.Name)

	r := s.resolver.Performer()

	aliases, _ := r.Aliases(s.ctx, performer)
	assert.Equal(s.t, aliases, input.Aliases)

	// ensure urls were set correctly
	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	assert.Equal(s.t, input.Urls, urls)

	birthdate, _ := s.resolver.Performer().Birthdate(s.ctx, performer)
	if input.Birthdate == nil {
		assert.Nil(s.t, birthdate)
	} else {
		assert.Equal(s.t, *input.Birthdate, birthdate.Date)
	}

	assert.Equal(s.t, performer.DeathDate, input.Deathdate)

	tattoos, _ := s.resolver.Performer().Tattoos(s.ctx, performer)
	assertBodyMods(s.t, input.Tattoos, tattoos, "Tattoos should match")

	piercings, _ := s.resolver.Performer().Piercings(s.ctx, performer)
	assertBodyMods(s.t, input.Piercings, piercings, "Piercings should match")

	assert.Equal(s.t, performer.CupSize, input.CupSize)

	assert.Equal(s.t, performer.BandSize, input.BandSize)

	assert.Equal(s.t, performer.WaistSize, input.WaistSize)

	assert.Equal(s.t, performer.HipSize, input.HipSize)
}

func (s *performerTestRunner) testDestroyPerformer() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	performerID := createdPerformer.UUID()

	destroyed, err := s.resolver.Mutation().PerformerDestroy(s.ctx, models.PerformerDestroyInput{
		ID: performerID,
	})
	assert.NoError(s.t, err, "Error destroying performer")
	assert.True(s.t, destroyed, "Performer was not destroyed")

	// ensure cannot find performer
	foundPerformer, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(s.t, err)

	assert.Nil(s.t, foundPerformer, "Found performer after destruction")

	// TODO - ensure scene was not removed
}

func (s *performerTestRunner) testQueryPerformers() {
	// Create test performers with specific attributes
	name1 := s.generatePerformerName()
	performer1, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: name1,
	})
	assert.NoError(s.t, err)

	name2 := s.generatePerformerName()
	performer2, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: name2,
	})
	assert.NoError(s.t, err)

	// Test basic query
	result, err := s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   25,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers")

	// Ensure we have at least the performers we created
	assert.True(s.t, result.Count >= 2, "Expected at least 2 performers in count")
	assert.True(s.t, len(result.Performers) >= 2, "Expected at least 2 performers in results")

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

	assert.True(s.t, found1, "Created performer 1 not found in query results")
	assert.True(s.t, found2, "Created performer 2 not found in query results")
}

func (s *performerTestRunner) testQueryPerformersBirthdate() {
	// Create test performers with specific birthdates
	birthdate1 := "2000-01-07"
	birthdate2 := "1995-06-15"
	birthdate3 := "2000-01-07" // Same as birthdate1

	name1 := s.generatePerformerName()
	performer1, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      name1,
		Birthdate: &birthdate1,
	})
	assert.NoError(s.t, err)

	name2 := s.generatePerformerName()
	performer2, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      name2,
		Birthdate: &birthdate2,
	})
	assert.NoError(s.t, err)

	name3 := s.generatePerformerName()
	performer3, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      name3,
		Birthdate: &birthdate3,
	})
	assert.NoError(s.t, err)

	// Test EQUALS modifier
	equalsResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
		Birthdate: &models.DateCriterionInput{
			Value:    birthdate1,
			Modifier: models.CriterionModifierEquals,
		},
	})
	assert.NoError(s.t, err, "Error querying performers with birthdate equals")
	assert.GreaterOrEqual(s.t, equalsResult.Count, 2, "Expected at least 2 performers with birthdate 2000-01-07")

	// Verify performers 1 and 3 are in results
	found1 := false
	found3 := false
	for _, p := range equalsResult.Performers {
		if p.ID == performer1.ID {
			found1 = true
		}
		if p.ID == performer3.ID {
			found3 = true
		}
		// Ensure performer2 is not in results
		assert.NotEqual(s.t, performer2.ID, p.ID, "Performer with different birthdate should not be in EQUALS results")
	}
	assert.True(s.t, found1, "Performer 1 with matching birthdate not found")
	assert.True(s.t, found3, "Performer 3 with matching birthdate not found")

	// Test GREATER_THAN modifier
	gtResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
		Birthdate: &models.DateCriterionInput{
			Value:    "1997-01-01",
			Modifier: models.CriterionModifierGreaterThan,
		},
	})
	assert.NoError(s.t, err, "Error querying performers with birthdate greater than")

	// Performer1 and Performer3 should be in results (born in 2000)
	foundGt1 := false
	foundGt3 := false
	for _, p := range gtResult.Performers {
		if p.ID == performer1.ID {
			foundGt1 = true
		}
		if p.ID == performer3.ID {
			foundGt3 = true
		}
		// Performer2 born in 1995 should not be in results
		assert.NotEqual(s.t, performer2.ID, p.ID, "Performer with birthdate before 1997 should not be in GREATER_THAN results")
	}
	assert.True(s.t, foundGt1, "Performer 1 born after 1997 should be in GREATER_THAN results")
	assert.True(s.t, foundGt3, "Performer 3 born after 1997 should be in GREATER_THAN results")

	// Test LESS_THAN modifier
	ltResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
		Birthdate: &models.DateCriterionInput{
			Value:    "1997-01-01",
			Modifier: models.CriterionModifierLessThan,
		},
	})
	assert.NoError(s.t, err, "Error querying performers with birthdate less than")

	// Performer2 should be in results (born in 1995)
	foundLt2 := false
	for _, p := range ltResult.Performers {
		if p.ID == performer2.ID {
			foundLt2 = true
		}
		// Performer1 and Performer3 born in 2000 should not be in results
		assert.NotEqual(s.t, performer1.ID, p.ID, "Performer with birthdate after 1997 should not be in LESS_THAN results")
		assert.NotEqual(s.t, performer3.ID, p.ID, "Performer with birthdate after 1997 should not be in LESS_THAN results")
	}
	assert.True(s.t, foundLt2, "Performer 2 born before 1997 should be in LESS_THAN results")

	// Test NOT_EQUALS modifier
	neResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
		Birthdate: &models.DateCriterionInput{
			Value:    birthdate1,
			Modifier: models.CriterionModifierNotEquals,
		},
	})
	assert.NoError(s.t, err, "Error querying performers with birthdate not equals")

	// Performer2 should be in results
	foundNe2 := false
	for _, p := range neResult.Performers {
		if p.ID == performer2.ID {
			foundNe2 = true
		}
		// Performer1 and Performer3 should not be in results
		assert.NotEqual(s.t, performer1.ID, p.ID, "Performer with matching birthdate should not be in NOT_EQUALS results")
		assert.NotEqual(s.t, performer3.ID, p.ID, "Performer with matching birthdate should not be in NOT_EQUALS results")
	}
	assert.True(s.t, foundNe2, "Performer 2 with different birthdate should be in NOT_EQUALS results")
}

func (s *performerTestRunner) testQueryPerformersMeasurementFilters() {
	namePrefix := s.generatePerformerName() + "-measurement-filter"
	heightOne := 165
	heightTwo := 175
	heightFour := 185
	bandOne := 32
	bandTwo := 34
	bandFour := 36
	waistOne := 24
	waistTwo := 26
	waistFour := 28
	hipOne := 34
	hipTwo := 36
	hipFour := 38

	performer1, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      namePrefix + "-one",
		Height:    &heightOne,
		BandSize:  &bandOne,
		WaistSize: &waistOne,
		HipSize:   &hipOne,
	})
	assert.NoError(s.t, err)

	performer2, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      namePrefix + "-two",
		Height:    &heightTwo,
		BandSize:  &bandTwo,
		WaistSize: &waistTwo,
		HipSize:   &hipTwo,
	})
	assert.NoError(s.t, err)

	performer3, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: namePrefix + "-three",
	})
	assert.NoError(s.t, err)

	performer4, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      namePrefix + "-four",
		Height:    &heightFour,
		BandSize:  &bandFour,
		WaistSize: &waistFour,
		HipSize:   &hipFour,
	})
	assert.NoError(s.t, err)

	heightResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		Height: &models.IntCriterionInput{
			Value:    heightOne,
			Modifier: models.CriterionModifierEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by height")
	assert.Equal(s.t, 1, heightResult.Count, "Expected exactly 1 performer with matching height")
	assert.Len(s.t, heightResult.Performers, 1, "Expected exactly 1 performer in height results")
	assert.Equal(s.t, performer1.ID, heightResult.Performers[0].ID, "Only performer 1 should match the height filter")
	assert.NotEqual(s.t, performer2.ID, heightResult.Performers[0].ID, "Performer 2 should not match the height filter")
	assert.NotEqual(s.t, performer3.ID, heightResult.Performers[0].ID, "Performer 3 should not match the height filter")
	assert.NotEqual(s.t, performer4.ID, heightResult.Performers[0].ID, "Performer 4 should not match the height filter")

	heightNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		Height: &models.IntCriterionInput{
			Modifier: models.CriterionModifierIsNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by height IS_NULL")
	assert.Equal(s.t, 1, heightNullResult.Count, "Expected exactly 1 performer with null height")
	assert.Len(s.t, heightNullResult.Performers, 1, "Expected exactly 1 performer in null height results")
	assert.Equal(s.t, performer3.ID, heightNullResult.Performers[0].ID, "Only performer 3 should match the height IS_NULL filter")

	bandSizeResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		BandSize: &models.IntCriterionInput{
			Value:    bandTwo,
			Modifier: models.CriterionModifierEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by band size")
	assert.Equal(s.t, 1, bandSizeResult.Count, "Expected exactly 1 performer with matching band size")
	assert.Len(s.t, bandSizeResult.Performers, 1, "Expected exactly 1 performer in band size results")
	assert.Equal(s.t, performer2.ID, bandSizeResult.Performers[0].ID, "Only performer 2 should match the band size filter")

	bandSizeNotNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		BandSize: &models.IntCriterionInput{
			Modifier: models.CriterionModifierNotNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by band size NOT_NULL")
	assert.Equal(s.t, 3, bandSizeNotNullResult.Count, "Expected exactly 3 performers with non-null band size")
	foundBandOne := false
	foundBandTwo := false
	foundBandFour := false
	for _, p := range bandSizeNotNullResult.Performers {
		if p.ID == performer1.ID {
			foundBandOne = true
		}
		if p.ID == performer2.ID {
			foundBandTwo = true
		}
		if p.ID == performer4.ID {
			foundBandFour = true
		}
		assert.NotEqual(s.t, performer3.ID, p.ID, "Performer with null band size should not be returned")
	}
	assert.True(s.t, foundBandOne, "Performer 1 with non-null band size not found")
	assert.True(s.t, foundBandTwo, "Performer 2 with non-null band size not found")
	assert.True(s.t, foundBandFour, "Performer 4 with non-null band size not found")

	waistSizeResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		WaistSize: &models.IntCriterionInput{
			Value:    waistFour,
			Modifier: models.CriterionModifierEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by waist size")
	assert.Equal(s.t, 1, waistSizeResult.Count, "Expected exactly 1 performer with matching waist size")
	assert.Len(s.t, waistSizeResult.Performers, 1, "Expected exactly 1 performer in waist size results")
	assert.Equal(s.t, performer4.ID, waistSizeResult.Performers[0].ID, "Only performer 4 should match the waist size filter")

	waistSizeNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		WaistSize: &models.IntCriterionInput{
			Modifier: models.CriterionModifierIsNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by waist size IS_NULL")
	assert.Equal(s.t, 1, waistSizeNullResult.Count, "Expected exactly 1 performer with null waist size")
	assert.Len(s.t, waistSizeNullResult.Performers, 1, "Expected exactly 1 performer in null waist size results")
	assert.Equal(s.t, performer3.ID, waistSizeNullResult.Performers[0].ID, "Only performer 3 should match the waist size IS_NULL filter")

	hipSizeResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		HipSize: &models.IntCriterionInput{
			Value:    hipOne,
			Modifier: models.CriterionModifierEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by hip size")
	assert.Equal(s.t, 1, hipSizeResult.Count, "Expected exactly 1 performer with matching hip size")
	assert.Len(s.t, hipSizeResult.Performers, 1, "Expected exactly 1 performer in hip size results")
	assert.Equal(s.t, performer1.ID, hipSizeResult.Performers[0].ID, "Only performer 1 should match the hip size filter")

	hipSizeNotNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		HipSize: &models.IntCriterionInput{
			Modifier: models.CriterionModifierNotNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by hip size NOT_NULL")
	assert.Equal(s.t, 3, hipSizeNotNullResult.Count, "Expected exactly 3 performers with non-null hip size")
	foundHipOne := false
	foundHipTwo := false
	foundHipFour := false
	for _, p := range hipSizeNotNullResult.Performers {
		if p.ID == performer1.ID {
			foundHipOne = true
		}
		if p.ID == performer2.ID {
			foundHipTwo = true
		}
		if p.ID == performer4.ID {
			foundHipFour = true
		}
		assert.NotEqual(s.t, performer3.ID, p.ID, "Performer with null hip size should not be returned")
	}
	assert.True(s.t, foundHipOne, "Performer 1 with non-null hip size not found")
	assert.True(s.t, foundHipTwo, "Performer 2 with non-null hip size not found")
	assert.True(s.t, foundHipFour, "Performer 4 with non-null hip size not found")
}

func (s *performerTestRunner) testQueryPerformersCareerYearFilters() {
	namePrefix := s.generatePerformerName() + "-career-filter"
	careerStartOne := 2010
	careerStartTwo := 2014
	careerStartFour := 2020
	careerEndOne := 2018
	careerEndTwo := 2022

	performer1, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:            namePrefix + "-one",
		CareerStartYear: &careerStartOne,
		CareerEndYear:   &careerEndOne,
	})
	assert.NoError(s.t, err)

	performer2, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:            namePrefix + "-two",
		CareerStartYear: &careerStartTwo,
		CareerEndYear:   &careerEndTwo,
	})
	assert.NoError(s.t, err)

	performer3, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: namePrefix + "-three",
	})
	assert.NoError(s.t, err)

	performer4, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:            namePrefix + "-four",
		CareerStartYear: &careerStartFour,
	})
	assert.NoError(s.t, err)

	careerStartYearResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CareerStartYear: &models.IntCriterionInput{
			Value:    careerStartTwo,
			Modifier: models.CriterionModifierEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by career start year")
	assert.Equal(s.t, 1, careerStartYearResult.Count, "Expected exactly 1 performer with matching career start year")
	assert.Len(s.t, careerStartYearResult.Performers, 1, "Expected exactly 1 performer in career start year results")
	assert.Equal(s.t, performer2.ID, careerStartYearResult.Performers[0].ID, "Only performer 2 should match the career start year filter")
	assert.NotEqual(s.t, performer1.ID, careerStartYearResult.Performers[0].ID, "Performer 1 should not match the career start year filter")
	assert.NotEqual(s.t, performer3.ID, careerStartYearResult.Performers[0].ID, "Performer 3 should not match the career start year filter")
	assert.NotEqual(s.t, performer4.ID, careerStartYearResult.Performers[0].ID, "Performer 4 should not match the career start year filter")

	careerStartYearNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CareerStartYear: &models.IntCriterionInput{
			Modifier: models.CriterionModifierIsNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by career start year IS_NULL")
	assert.Equal(s.t, 1, careerStartYearNullResult.Count, "Expected exactly 1 performer with null career start year")
	assert.Len(s.t, careerStartYearNullResult.Performers, 1, "Expected exactly 1 performer in null career start year results")
	assert.Equal(s.t, performer3.ID, careerStartYearNullResult.Performers[0].ID, "Only performer 3 should match the career start year IS_NULL filter")

	careerEndYearResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CareerEndYear: &models.IntCriterionInput{
			Value:    careerEndTwo,
			Modifier: models.CriterionModifierEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by career end year")
	assert.Equal(s.t, 1, careerEndYearResult.Count, "Expected exactly 1 performer with matching career end year")
	assert.Len(s.t, careerEndYearResult.Performers, 1, "Expected exactly 1 performer in career end year results")
	assert.Equal(s.t, performer2.ID, careerEndYearResult.Performers[0].ID, "Only performer 2 should match the career end year filter")
	assert.NotEqual(s.t, performer1.ID, careerEndYearResult.Performers[0].ID, "Performer 1 should not match the career end year filter")
	assert.NotEqual(s.t, performer3.ID, careerEndYearResult.Performers[0].ID, "Performer 3 should not match the career end year filter")
	assert.NotEqual(s.t, performer4.ID, careerEndYearResult.Performers[0].ID, "Performer 4 should not match the career end year filter")

	careerEndYearNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CareerEndYear: &models.IntCriterionInput{
			Modifier: models.CriterionModifierIsNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by career end year IS_NULL")
	assert.Equal(s.t, 2, careerEndYearNullResult.Count, "Expected exactly 2 performers with null career end year")
	foundCareerEndNullThree := false
	foundCareerEndNullFour := false
	for _, p := range careerEndYearNullResult.Performers {
		if p.ID == performer3.ID {
			foundCareerEndNullThree = true
		}
		if p.ID == performer4.ID {
			foundCareerEndNullFour = true
		}
		assert.NotEqual(s.t, performer1.ID, p.ID, "Performer 1 should not match the career end year IS_NULL filter")
		assert.NotEqual(s.t, performer2.ID, p.ID, "Performer 2 should not match the career end year IS_NULL filter")
	}
	assert.True(s.t, foundCareerEndNullThree, "Performer 3 with null career end year not found")
	assert.True(s.t, foundCareerEndNullFour, "Performer 4 with null career end year not found")
}

func (s *performerTestRunner) testQueryPerformersEnumColumnFilters() {
	namePrefix := s.generatePerformerName() + "-enum-filter"
	eyeColorOne := models.EyeColorEnumBlue
	eyeColorTwo := models.EyeColorEnumBrown
	eyeColorFour := models.EyeColorEnumGreen
	hairColorOne := models.HairColorEnumBlonde
	hairColorTwo := models.HairColorEnumBlack
	hairColorFour := models.HairColorEnumRed
	breastTypeOne := models.BreastTypeEnumNatural
	breastTypeTwo := models.BreastTypeEnumFake
	breastTypeFour := models.BreastTypeEnumNa

	performer1, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:       namePrefix + "-one",
		EyeColor:   &eyeColorOne,
		HairColor:  &hairColorOne,
		BreastType: &breastTypeOne,
	})
	assert.NoError(s.t, err)

	performer2, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:       namePrefix + "-two",
		EyeColor:   &eyeColorTwo,
		HairColor:  &hairColorTwo,
		BreastType: &breastTypeTwo,
	})
	assert.NoError(s.t, err)

	performer3, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: namePrefix + "-three",
	})
	assert.NoError(s.t, err)

	performer4, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:       namePrefix + "-four",
		EyeColor:   &eyeColorFour,
		HairColor:  &hairColorFour,
		BreastType: &breastTypeFour,
	})
	assert.NoError(s.t, err)

	eyeColorResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		EyeColor: &models.EyeColorCriterionInput{
			Value:    &eyeColorOne,
			Modifier: models.CriterionModifierEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by eye color")
	assert.Equal(s.t, 1, eyeColorResult.Count, "Expected exactly 1 performer with matching eye color")
	assert.Len(s.t, eyeColorResult.Performers, 1, "Expected exactly 1 performer in eye color results")
	assert.Equal(s.t, performer1.ID, eyeColorResult.Performers[0].ID, "Only performer 1 should match the eye color filter")
	assert.NotEqual(s.t, performer2.ID, eyeColorResult.Performers[0].ID, "Performer 2 should not match the eye color filter")
	assert.NotEqual(s.t, performer3.ID, eyeColorResult.Performers[0].ID, "Performer 3 should not match the eye color filter")
	assert.NotEqual(s.t, performer4.ID, eyeColorResult.Performers[0].ID, "Performer 4 should not match the eye color filter")

	eyeColorNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		EyeColor: &models.EyeColorCriterionInput{
			Modifier: models.CriterionModifierIsNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by eye color IS_NULL")
	assert.Equal(s.t, 1, eyeColorNullResult.Count, "Expected exactly 1 performer with null eye color")
	assert.Len(s.t, eyeColorNullResult.Performers, 1, "Expected exactly 1 performer in null eye color results")
	assert.Equal(s.t, performer3.ID, eyeColorNullResult.Performers[0].ID, "Only performer 3 should match the eye color IS_NULL filter")

	hairColorResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		HairColor: &models.HairColorCriterionInput{
			Value:    &hairColorOne,
			Modifier: models.CriterionModifierNotEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by hair color NOT_EQUALS")
	assert.Equal(s.t, 2, hairColorResult.Count, "Expected exactly 2 performers with hair color not equal to BLONDE")
	foundHairTwo := false
	foundHairFour := false
	for _, p := range hairColorResult.Performers {
		if p.ID == performer2.ID {
			foundHairTwo = true
		}
		if p.ID == performer4.ID {
			foundHairFour = true
		}
		assert.NotEqual(s.t, performer1.ID, p.ID, "Performer 1 should not match the hair color NOT_EQUALS filter")
		assert.NotEqual(s.t, performer3.ID, p.ID, "Performer with null hair color should not match the hair color NOT_EQUALS filter")
	}
	assert.True(s.t, foundHairTwo, "Performer 2 with non-matching hair color not found")
	assert.True(s.t, foundHairFour, "Performer 4 with non-matching hair color not found")

	hairColorNotNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		HairColor: &models.HairColorCriterionInput{
			Modifier: models.CriterionModifierNotNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by hair color NOT_NULL")
	assert.Equal(s.t, 3, hairColorNotNullResult.Count, "Expected exactly 3 performers with non-null hair color")

	breastTypeResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		BreastType: &models.BreastTypeCriterionInput{
			Value:    &breastTypeOne,
			Modifier: models.CriterionModifierEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by breast type")
	assert.Equal(s.t, 1, breastTypeResult.Count, "Expected exactly 1 performer with matching breast type")
	assert.Len(s.t, breastTypeResult.Performers, 1, "Expected exactly 1 performer in breast type results")
	assert.Equal(s.t, performer1.ID, breastTypeResult.Performers[0].ID, "Only performer 1 should match the breast type filter")
	assert.NotEqual(s.t, performer2.ID, breastTypeResult.Performers[0].ID, "Performer 2 should not match the breast type filter")
	assert.NotEqual(s.t, performer3.ID, breastTypeResult.Performers[0].ID, "Performer 3 should not match the breast type filter")
	assert.NotEqual(s.t, performer4.ID, breastTypeResult.Performers[0].ID, "Performer 4 should not match the breast type filter")

	breastTypeNotNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		BreastType: &models.BreastTypeCriterionInput{
			Modifier: models.CriterionModifierNotNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by breast type NOT_NULL")
	assert.Equal(s.t, 3, breastTypeNotNullResult.Count, "Expected exactly 3 performers with non-null breast type")
}

func (s *performerTestRunner) testQueryPerformersCupSizeFilters() {
	namePrefix := s.generatePerformerName() + "-cup-filter"
	cupOne := "C"
	cupTwo := "e"
	cupFour := "AA"
	cupFive := "ZZ"

	performer1, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:    namePrefix + "-one",
		CupSize: &cupOne,
	})
	assert.NoError(s.t, err)

	performer2, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:    namePrefix + "-two",
		CupSize: &cupTwo,
	})
	assert.NoError(s.t, err)

	performer3, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: namePrefix + "-three",
	})
	assert.NoError(s.t, err)

	performer4, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:    namePrefix + "-four",
		CupSize: &cupFour,
	})
	assert.NoError(s.t, err)

	performer5, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:    namePrefix + "-five",
		CupSize: &cupFive,
	})
	assert.NoError(s.t, err)

	cupEqualsResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CupSize: &models.StringCriterionInput{
			Value:    " c ",
			Modifier: models.CriterionModifierEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by cup size equals")
	assert.Equal(s.t, 1, cupEqualsResult.Count, "Expected exactly 1 performer with matching normalized cup size")
	assert.Len(s.t, cupEqualsResult.Performers, 1, "Expected exactly 1 performer in cup size equals results")
	assert.Equal(s.t, performer1.ID, cupEqualsResult.Performers[0].ID, "Only performer 1 should match the cup size EQUALS filter")

	cupNotEqualsResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CupSize: &models.StringCriterionInput{
			Value:    "c",
			Modifier: models.CriterionModifierNotEquals,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by cup size not equals")
	assert.Equal(s.t, 3, cupNotEqualsResult.Count, "Expected exactly 3 performers with cup size not equal to C")
	foundCupNotEqualsTwo := false
	foundCupNotEqualsFour := false
	foundCupNotEqualsFive := false
	for _, p := range cupNotEqualsResult.Performers {
		if p.ID == performer2.ID {
			foundCupNotEqualsTwo = true
		}
		if p.ID == performer4.ID {
			foundCupNotEqualsFour = true
		}
		if p.ID == performer5.ID {
			foundCupNotEqualsFive = true
		}
		assert.NotEqual(s.t, performer1.ID, p.ID, "Performer 1 should not match the cup size NOT_EQUALS filter")
		assert.NotEqual(s.t, performer3.ID, p.ID, "Performer with null cup size should not match the cup size NOT_EQUALS filter")
	}
	assert.True(s.t, foundCupNotEqualsTwo, "Performer 2 with different cup size not found")
	assert.True(s.t, foundCupNotEqualsFour, "Performer 4 with different cup size not found")
	assert.True(s.t, foundCupNotEqualsFive, "Performer 5 with unranked cup size not found in NOT_EQUALS results")

	cupGreaterThanResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CupSize: &models.StringCriterionInput{
			Value:    " c ",
			Modifier: models.CriterionModifierGreaterThan,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by cup size greater than")
	assert.Equal(s.t, 1, cupGreaterThanResult.Count, "Expected exactly 1 performer with ranked cup size greater than C")
	assert.Len(s.t, cupGreaterThanResult.Performers, 1, "Expected exactly 1 performer in cup size greater than results")
	assert.Equal(s.t, performer2.ID, cupGreaterThanResult.Performers[0].ID, "Only performer 2 should match the cup size GREATER_THAN filter")
	assert.NotEqual(s.t, performer5.ID, cupGreaterThanResult.Performers[0].ID, "Unranked cup sizes should not match ordered cup size filters")

	cupLessThanResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CupSize: &models.StringCriterionInput{
			Value:    " c ",
			Modifier: models.CriterionModifierLessThan,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by cup size less than")
	assert.Equal(s.t, 1, cupLessThanResult.Count, "Expected exactly 1 performer with ranked cup size less than C")
	assert.Len(s.t, cupLessThanResult.Performers, 1, "Expected exactly 1 performer in cup size less than results")
	assert.Equal(s.t, performer4.ID, cupLessThanResult.Performers[0].ID, "Only performer 4 should match the cup size LESS_THAN filter")
	assert.NotEqual(s.t, performer5.ID, cupLessThanResult.Performers[0].ID, "Unranked cup sizes should not match ordered cup size filters")

	cupNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CupSize: &models.StringCriterionInput{
			Modifier: models.CriterionModifierIsNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by cup size IS_NULL")
	assert.Equal(s.t, 1, cupNullResult.Count, "Expected exactly 1 performer with null cup size")
	assert.Len(s.t, cupNullResult.Performers, 1, "Expected exactly 1 performer in null cup size results")
	assert.Equal(s.t, performer3.ID, cupNullResult.Performers[0].ID, "Only performer 3 should match the cup size IS_NULL filter")

	cupNotNullResult, err := s.client.queryPerformers(models.PerformerQueryInput{
		Name: &namePrefix,
		CupSize: &models.StringCriterionInput{
			Modifier: models.CriterionModifierNotNull,
		},
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by cup size NOT_NULL")
	assert.Equal(s.t, 4, cupNotNullResult.Count, "Expected exactly 4 performers with non-null cup size")
	foundCupNotNullOne := false
	foundCupNotNullTwo := false
	foundCupNotNullFour := false
	foundCupNotNullFive := false
	for _, p := range cupNotNullResult.Performers {
		if p.ID == performer1.ID {
			foundCupNotNullOne = true
		}
		if p.ID == performer2.ID {
			foundCupNotNullTwo = true
		}
		if p.ID == performer4.ID {
			foundCupNotNullFour = true
		}
		if p.ID == performer5.ID {
			foundCupNotNullFive = true
		}
		assert.NotEqual(s.t, performer3.ID, p.ID, "Performer with null cup size should not match the cup size NOT_NULL filter")
	}
	assert.True(s.t, foundCupNotNullOne, "Performer 1 with non-null cup size not found")
	assert.True(s.t, foundCupNotNullTwo, "Performer 2 with non-null cup size not found")
	assert.True(s.t, foundCupNotNullFour, "Performer 4 with non-null cup size not found")
	assert.True(s.t, foundCupNotNullFive, "Performer 5 with non-null cup size not found")
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

func (s *performerTestRunner) testQueryPerformersByAgeAndBirthYear() {
	// Use relative dates based on current time so tests don't break as time passes
	now := time.Now()
	currentYear := now.Year()

	// Calculate birthdates for specific ages (use January 1st to ensure birthday has passed)
	birthYear30 := currentYear - 30
	birthYear25 := currentYear - 25
	birthYear20 := currentYear - 20

	birthdate30YearsAgo := time.Date(birthYear30, 1, 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
	birthdate25YearsAgo := time.Date(birthYear25, 1, 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
	birthdate20YearsAgo := time.Date(birthYear20, 1, 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
	// Death date 5 years ago (so performer born 25 years ago died at age 20)
	deathdate5YearsAgo := time.Date(currentYear-5, 4, 19, 0, 0, 0, 0, time.UTC).Format("2006-01-02")

	// Create performer age 30 (alive)
	name1 := s.generatePerformerName()
	performer1, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      name1,
		Birthdate: &birthdate30YearsAgo,
	})
	assert.NoError(s.t, err)

	// Create performer age 25 (alive)
	name2 := s.generatePerformerName()
	performer2, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      name2,
		Birthdate: &birthdate25YearsAgo,
	})
	assert.NoError(s.t, err)

	// Create performer born 25 years ago but died 5 years ago (age at death: 20)
	name3 := s.generatePerformerName()
	performer3, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      name3,
		Birthdate: &birthdate25YearsAgo,
		Deathdate: &deathdate5YearsAgo,
	})
	assert.NoError(s.t, err)

	// Create performer age 20 (alive)
	name4 := s.generatePerformerName()
	performer4, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:      name4,
		Birthdate: &birthdate20YearsAgo,
	})
	assert.NoError(s.t, err)

	// Test birth_year filter: query for performers born in birthYear25
	birthYearFilter25 := &models.IntCriterionInput{
		Value:    birthYear25,
		Modifier: models.CriterionModifierEquals,
	}
	result, err := s.client.queryPerformers(models.PerformerQueryInput{
		BirthYear: birthYearFilter25,
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by birth year")
	assert.True(s.t, result.Count >= 2, "Expected at least 2 performers born in year %d", birthYear25)

	// Verify both performers born in birthYear25 are in results
	found2 := false
	found3 := false
	for _, p := range result.Performers {
		if p.ID == performer2.ID {
			found2 = true
		}
		if p.ID == performer3.ID {
			found3 = true
		}
	}
	assert.True(s.t, found2, "Performer born in %d (alive) not found", birthYear25)
	assert.True(s.t, found3, "Performer born in %d (deceased) not found", birthYear25)

	// Test birth_year filter: query for performers born in birthYear30
	birthYearFilter30 := &models.IntCriterionInput{
		Value:    birthYear30,
		Modifier: models.CriterionModifierEquals,
	}
	result, err = s.client.queryPerformers(models.PerformerQueryInput{
		BirthYear: birthYearFilter30,
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by birth year %d", birthYear30)
	assert.True(s.t, result.Count >= 1, "Expected at least 1 performer born in %d", birthYear30)

	// Verify performer born in birthYear30 is in results
	found1 := false
	for _, p := range result.Performers {
		if p.ID == performer1.ID {
			found1 = true
		}
	}
	assert.True(s.t, found1, "Performer born in %d not found", birthYear30)

	// Test age filter: query for performers age 25 (still alive)
	age25 := &models.IntCriterionInput{
		Value:    25,
		Modifier: models.CriterionModifierEquals,
	}
	result, err = s.client.queryPerformers(models.PerformerQueryInput{
		Age:       age25,
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by age 25")
	assert.True(s.t, result.Count >= 1, "Expected at least 1 performer age 25")

	// Verify performer2 (alive, age 25) is in results
	found2 = false
	for _, p := range result.Performers {
		if p.ID == performer2.ID {
			found2 = true
		}
		// performer3 should NOT be in results (died at age 20)
		if p.ID == performer3.ID {
			s.t.Errorf("Performer who died at age 20 should not be in age 25 results")
		}
	}
	assert.True(s.t, found2, "Performer age 25 not found")

	// Test age filter: query for performers age 20
	age20 := &models.IntCriterionInput{
		Value:    20,
		Modifier: models.CriterionModifierEquals,
	}
	result, err = s.client.queryPerformers(models.PerformerQueryInput{
		Age:       age20,
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying performers by age 20")
	assert.True(s.t, result.Count >= 2, "Expected at least 2 performers age 20")

	// Verify both performer3 (died at 20) and performer4 (currently 20) are in results
	found3 = false
	found4 := false
	for _, p := range result.Performers {
		if p.ID == performer3.ID {
			found3 = true
		}
		if p.ID == performer4.ID {
			found4 = true
		}
	}
	assert.True(s.t, found3, "Performer who died at age 20 not found")
	assert.True(s.t, found4, "Performer currently age 20 not found")
}

func (s *performerTestRunner) testQueryPerformersSceneCountSort() {
	// Test that performers with 0 scenes are returned when sorting by SCENE_COUNT
	// Create performer with no scenes
	performerWithNoScenes, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: s.generatePerformerName(),
	})
	assert.NoError(s.t, err)

	// Create performer with scenes
	performerWithScenes, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: s.generatePerformerName(),
	})
	assert.NoError(s.t, err)

	// Create a scene with the second performer
	sceneDate := "2020-01-15"
	sceneTitle := s.generateSceneName()
	_, err = s.createTestScene(&models.SceneCreateInput{
		Title: &sceneTitle,
		Date:  sceneDate,
		Performers: []models.PerformerAppearanceInput{
			{
				PerformerID: performerWithScenes.UUID(),
			},
		},
	})
	assert.NoError(s.t, err)

	// Query performers sorted by SCENE_COUNT DESC (most scenes first)
	result, err := s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.PerformerSortEnumSceneCount,
	})
	assert.NoError(s.t, err, "Error querying performers by scene count")

	// Find our test performers in the results
	foundWithNoScenes := false
	foundWithScenes := false
	indexWithNoScenes := -1
	indexWithScenes := -1
	for i, p := range result.Performers {
		if p.ID == performerWithNoScenes.ID {
			foundWithNoScenes = true
			indexWithNoScenes = i
		}
		if p.ID == performerWithScenes.ID {
			foundWithScenes = true
			indexWithScenes = i
		}
	}

	// Both performers should be in the results
	assert.True(s.t, foundWithNoScenes, "Performer with 0 scenes not found when sorting by SCENE_COUNT DESC")
	assert.True(s.t, foundWithScenes, "Performer with scenes not found when sorting by SCENE_COUNT DESC")
	// Performer with scenes should come before performer with 0 scenes when sorting DESC
	if foundWithNoScenes && foundWithScenes {
		assert.Less(s.t, indexWithScenes, indexWithNoScenes, "Performer with scenes should come before performer with 0 scenes when sorting DESC")
	}

	// Query performers sorted by SCENE_COUNT ASC (fewest scenes first)
	result, err = s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.PerformerSortEnumSceneCount,
	})
	assert.NoError(s.t, err, "Error querying performers by scene count ASC")

	foundWithNoScenes = false
	foundWithScenes = false
	indexWithNoScenes = -1
	indexWithScenes = -1
	for i, p := range result.Performers {
		if p.ID == performerWithNoScenes.ID {
			foundWithNoScenes = true
			indexWithNoScenes = i
		}
		if p.ID == performerWithScenes.ID {
			foundWithScenes = true
			indexWithScenes = i
		}
	}

	assert.True(s.t, foundWithNoScenes, "Performer with 0 scenes not found when sorting by SCENE_COUNT ASC")
	assert.True(s.t, foundWithScenes, "Performer with scenes not found when sorting by SCENE_COUNT ASC")
	// Performer with 0 scenes should come before performer with scenes when sorting ASC
	if foundWithNoScenes && foundWithScenes {
		assert.Less(s.t, indexWithNoScenes, indexWithScenes, "Performer with 0 scenes should come before performer with scenes when sorting ASC")
	}

	// Test sorting by DEBUT
	result, err = s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.PerformerSortEnumDebut,
	})
	assert.NoError(s.t, err, "Error querying performers by debut")

	foundWithNoScenes = false
	foundWithScenes = false
	for _, p := range result.Performers {
		if p.ID == performerWithNoScenes.ID {
			foundWithNoScenes = true
		}
		if p.ID == performerWithScenes.ID {
			foundWithScenes = true
		}
	}

	assert.True(s.t, foundWithNoScenes, "Performer with 0 scenes not found when sorting by DEBUT")
	assert.True(s.t, foundWithScenes, "Performer with scenes not found when sorting by DEBUT")

	// Test sorting by LAST_SCENE
	result, err = s.client.queryPerformers(models.PerformerQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumDesc,
		Sort:      models.PerformerSortEnumLastScene,
	})
	assert.NoError(s.t, err, "Error querying performers by last scene")

	foundWithNoScenes = false
	foundWithScenes = false
	for _, p := range result.Performers {
		if p.ID == performerWithNoScenes.ID {
			foundWithNoScenes = true
		}
		if p.ID == performerWithScenes.ID {
			foundWithScenes = true
		}
	}

	assert.True(s.t, foundWithNoScenes, "Performer with 0 scenes not found when sorting by LAST_SCENE")
	assert.True(s.t, foundWithScenes, "Performer with scenes not found when sorting by LAST_SCENE")

	// Verify count matches actual performer count
	totalCount := len(result.Performers)
	assert.Equal(s.t, result.Count, totalCount, "Count field should match number of performers returned")
}

func TestQueryPerformers(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testQueryPerformers()
}

func TestQueryPerformersBirthdate(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testQueryPerformersBirthdate()
}

func TestQueryPerformersMeasurementFilters(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testQueryPerformersMeasurementFilters()
}

func TestQueryPerformersCareerYearFilters(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testQueryPerformersCareerYearFilters()
}

func TestQueryPerformersEnumColumnFilters(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testQueryPerformersEnumColumnFilters()
}

func TestQueryPerformersCupSizeFilters(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testQueryPerformersCupSizeFilters()
}

func TestQueryPerformersByAgeAndBirthYear(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testQueryPerformersByAgeAndBirthYear()
}

func TestQueryPerformersSceneCountSort(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testQueryPerformersSceneCountSort()
}
