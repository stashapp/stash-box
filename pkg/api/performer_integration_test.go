// +build integration

package api_test

import (
	"reflect"
	"strconv"
	"testing"

	"github.com/stashapp/stashdb/pkg/models"

	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
)

type performerTestRunner struct {
	testRunner
}

func createPerformerTestRunner(t *testing.T) *performerTestRunner {
	return &performerTestRunner{
		testRunner: *createTestRunner(t),
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

	input := models.PerformerCreateInput{
		Name:           s.generatePerformerName(),
		Disambiguation: &disambiguation,
		Aliases:        []string{"Alias1", "Alias2"},
		Gender:         &gender,
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "URL",
				Type: "Type",
			},
		},
		Birthdate: &models.FuzzyDateInput{
			Date:     "2001-02-03",
			Accuracy: models.DateAccuracyEnumDay,
		},
		Ethnicity: &ethnicity,
		Country:   &country,
		EyeColor:  &eyeColor,
		HairColor: &hairColor,
		Height:    &height,
		Measurements: &models.MeasurementsInput{
			CupSize:  &cupSize,
			BandSize: &bandSize,
			Waist:    &bandSize,
			Hip:      &bandSize,
		},
		BreastType:      &breastType,
		CareerStartYear: &careerStartYear,
		CareerEndYear:   nil,
		Tattoos: []*models.BodyModificationInput{
			&models.BodyModificationInput{
				Location:    "Inner thigh",
				Description: &tattooDesc,
			},
		},
		Piercings: []*models.BodyModificationInput{
			&models.BodyModificationInput{
				Location:    "Nose",
				Description: nil,
			},
		},
	}

	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, input)

	if err != nil {
		s.t.Errorf("Error creating performer: %s", err.Error())
		return
	}

	s.verifyCreatedPerformer(input, performer)
}

func compareBodyMods(input []*models.BodyModificationInput, bodyMods []*models.BodyModification) bool {
	if len(bodyMods) != len(input) {
		return false
	}

	for i, v := range bodyMods {
		if v.Location != input[i].Location {
			return false
		}

		if v.Description != input[i].Description {
			if v.Description == nil || input[i].Description == nil {
				return false
			}

			if *v.Description != *input[i].Description {
				return false
			}
		}
	}

	return true
}

func compareUrls(input []*models.URLInput, urls []*models.URL) bool {
	if len(urls) != len(input) {
		return false
	}

	for i, v := range urls {
		if v.URL != input[i].URL || v.Type != input[i].Type {
			return false
		}
	}

	return true
}

func (s *performerTestRunner) verifyCreatedPerformer(input models.PerformerCreateInput, performer *models.Performer) {
	// ensure basic attributes are set correctly
	if input.Name != performer.Name {
		s.fieldMismatch(input.Name, performer.Name, "Name")
	}

	r := s.resolver.Performer()

	id, _ := r.ID(s.ctx, performer)
	if id == "" {
		s.t.Errorf("Expected created performer id to be non-zero")
	}

	if v, _ := r.Disambiguation(s.ctx, performer); !reflect.DeepEqual(v, input.Disambiguation) {
		s.fieldMismatch(*input.Disambiguation, v, "Disambiguation")
	}

	if v, _ := r.Aliases(s.ctx, performer); !reflect.DeepEqual(v, input.Aliases) {
		s.fieldMismatch(input.Aliases, v, "Aliases")
	}

	if v, _ := r.Gender(s.ctx, performer); !reflect.DeepEqual(v, input.Gender) {
		s.fieldMismatch(*input.Gender, v, "Gender")
	}

	// ensure urls were set correctly
	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	if !compareUrls(input.Urls, urls) {
		s.fieldMismatch(input.Urls, urls, "Urls")
	}

	birthdate, _ := r.Birthdate(s.ctx, performer)
	if !bothNil(birthdate, input.Birthdate) && (oneNil(birthdate, input.Birthdate) || birthdate.Date != input.Birthdate.Date || birthdate.Accuracy != input.Birthdate.Accuracy) {
		s.fieldMismatch(input.Birthdate, birthdate, "Birthdate")
	}

	if v, _ := r.Ethnicity(s.ctx, performer); !reflect.DeepEqual(v, input.Ethnicity) {
		s.fieldMismatch(*input.Ethnicity, v, "Ethnicity")
	}

	if v, _ := r.Country(s.ctx, performer); !reflect.DeepEqual(v, input.Country) {
		s.fieldMismatch(*input.Country, v, "Country")
	}

	if v, _ := r.EyeColor(s.ctx, performer); !reflect.DeepEqual(v, input.EyeColor) {
		s.fieldMismatch(*input.HairColor, v, "EyeColor")
	}

	if v, _ := r.HairColor(s.ctx, performer); !reflect.DeepEqual(v, input.HairColor) {
		s.fieldMismatch(*input.HairColor, v, "HairColor")
	}

	if v, _ := r.Height(s.ctx, performer); !reflect.DeepEqual(v, input.Height) {
		s.fieldMismatch(*input.Height, v, "Height")
	}

	measurements, _ := r.Measurements(s.ctx, performer)
	if !bothNil(measurements, input.Measurements) && (oneNil(measurements, input.Measurements) ||
		*measurements.CupSize != *input.Measurements.CupSize ||
		*measurements.BandSize != *input.Measurements.BandSize ||
		*measurements.Waist != *input.Measurements.Waist ||
		*measurements.Hip != *input.Measurements.Hip) {
		s.fieldMismatch(input.Measurements, measurements, "Measurements")
	}

	if v, _ := r.BreastType(s.ctx, performer); !reflect.DeepEqual(v, input.BreastType) {
		s.fieldMismatch(*input.BreastType, v, "BreastType")
	}

	if v, _ := r.CareerStartYear(s.ctx, performer); !reflect.DeepEqual(v, input.CareerStartYear) {
		s.fieldMismatch(*input.CareerStartYear, v, "CareerStartYear")
	}

	if v, _ := r.CareerEndYear(s.ctx, performer); !reflect.DeepEqual(v, input.CareerEndYear) {
		s.fieldMismatch(nil, v, "CareerEndYear")
	}

	tattoos, _ := s.resolver.Performer().Tattoos(s.ctx, performer)
	if !compareBodyMods(input.Tattoos, tattoos) {
		s.fieldMismatch(input.Tattoos, tattoos, "Tattoos")
	}

	piercings, _ := s.resolver.Performer().Piercings(s.ctx, performer)
	if !compareBodyMods(input.Piercings, piercings) {
		s.fieldMismatch(input.Piercings, piercings, "Piercings")
	}
}

func (s *performerTestRunner) testFindPerformer() {
	createdPerformer, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}

	performer, err := s.resolver.Query().FindPerformer(s.ctx, strconv.FormatInt(createdPerformer.ID, 10))
	if err != nil {
		s.t.Errorf("Error finding performer: %s", err.Error())
		return
	}

	// ensure returned performer is not nil
	if performer == nil {
		s.t.Error("Did not find performer by id")
		return
	}

	// ensure values were set
	if createdPerformer.Name != performer.Name {
		s.fieldMismatch(createdPerformer.Name, performer.Name, "Name")
	}
}

func (s *performerTestRunner) testUpdatePerformer() {
	cupSize := "C"
	bandSize := 32
	tattooDesc := "Foobar"

	input := &models.PerformerCreateInput{
		Name:    s.generatePerformerName(),
		Aliases: []string{"Alias1", "Alias2"},
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "URL",
				Type: "Type",
			},
		},
		Birthdate: &models.FuzzyDateInput{
			Date:     "2001-02-03",
			Accuracy: models.DateAccuracyEnumDay,
		},
		Measurements: &models.MeasurementsInput{
			CupSize:  &cupSize,
			BandSize: &bandSize,
			Waist:    &bandSize,
			Hip:      &bandSize,
		},
		Tattoos: []*models.BodyModificationInput{
			&models.BodyModificationInput{
				Location:    "Inner thigh",
				Description: &tattooDesc,
			},
		},
		Piercings: []*models.BodyModificationInput{
			&models.BodyModificationInput{
				Location:    "Nose",
				Description: nil,
			},
		},
	}

	createdPerformer, err := s.createTestPerformer(input)
	if err != nil {
		return
	}

	performerID := strconv.FormatInt(createdPerformer.ID, 10)

	updateInput := models.PerformerUpdateInput{
		ID:      performerID,
		Aliases: []string{"Alias3", "Alias4"},
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "URL",
				Type: "Type",
			},
		},
		Birthdate: &models.FuzzyDateInput{
			Date:     "2001-02-03",
			Accuracy: models.DateAccuracyEnumDay,
		},
		Measurements: &models.MeasurementsInput{
			CupSize:  &cupSize,
			BandSize: &bandSize,
			Waist:    &bandSize,
			Hip:      &bandSize,
		},
		Tattoos: []*models.BodyModificationInput{
			&models.BodyModificationInput{
				Location:    "Tramp stamp",
				Description: &tattooDesc,
			},
		},
		Piercings: []*models.BodyModificationInput{
			&models.BodyModificationInput{
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
		"measurements",
		"tattoos",
		"piercings",
	})

	updatedPerformer, err := s.resolver.Mutation().PerformerUpdate(ctx, updateInput)
	if err != nil {
		s.t.Errorf("Error updating performer: %s", err.Error())
		return
	}

	s.verifyUpdatedPerformer(updateInput, updatedPerformer)
}

func (s *performerTestRunner) testUpdatePerformerName() {
	cupSize := "C"
	bandSize := 32
	tattooDesc := "Foobar"

	input := &models.PerformerCreateInput{
		Name:    s.generatePerformerName(),
		Aliases: []string{"Alias1", "Alias2"},
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "URL",
				Type: "Type",
			},
		},
		Birthdate: &models.FuzzyDateInput{
			Date:     "2001-02-03",
			Accuracy: models.DateAccuracyEnumDay,
		},
		Measurements: &models.MeasurementsInput{
			CupSize:  &cupSize,
			BandSize: &bandSize,
			Waist:    &bandSize,
			Hip:      &bandSize,
		},
		Tattoos: []*models.BodyModificationInput{
			&models.BodyModificationInput{
				Location:    "Inner thigh",
				Description: &tattooDesc,
			},
		},
		Piercings: []*models.BodyModificationInput{
			&models.BodyModificationInput{
				Location:    "Nose",
				Description: nil,
			},
		},
	}

	createdPerformer, err := s.createTestPerformer(input)
	if err != nil {
		return
	}

	performerID := strconv.FormatInt(createdPerformer.ID, 10)

	updatedName := s.generatePerformerName()
	updateInput := models.PerformerUpdateInput{
		ID:   performerID,
		Name: &updatedName,
	}

	// need some mocking of the context to make the field ignore behaviour work
	ctx := s.updateContext([]string{
		"name",
	})
	updatedPerformer, err := s.resolver.Mutation().PerformerUpdate(ctx, updateInput)
	if err != nil {
		s.t.Errorf("Error updating performer: %s", err.Error())
		return
	}

	input.Name = updatedName
	s.verifyCreatedPerformer(*input, updatedPerformer)
}

func (s *performerTestRunner) verifyUpdatedPerformer(input models.PerformerUpdateInput, performer *models.Performer) {
	// ensure basic attributes are set correctly
	if input.Name != nil && *input.Name != performer.Name {
		s.fieldMismatch(input.Name, performer.Name, "Name")
	}

	r := s.resolver.Performer()

	if v, _ := r.Aliases(s.ctx, performer); !reflect.DeepEqual(v, input.Aliases) {
		s.fieldMismatch(input.Aliases, v, "Aliases")
	}

	// ensure urls were set correctly
	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	if !compareUrls(input.Urls, urls) {
		s.fieldMismatch(input.Urls, urls, "Urls")
	}

	birthdate, _ := r.Birthdate(s.ctx, performer)
	if birthdate != nil && (birthdate.Date != input.Birthdate.Date || birthdate.Accuracy != input.Birthdate.Accuracy) {
		s.fieldMismatch(input.Birthdate, birthdate, "Birthdate")
	}

	measurements, _ := r.Measurements(s.ctx, performer)
	if input.Measurements != nil && (*measurements.CupSize != *input.Measurements.CupSize ||
		*measurements.BandSize != *input.Measurements.BandSize ||
		*measurements.Waist != *input.Measurements.Waist ||
		*measurements.Hip != *input.Measurements.Hip) {
		s.fieldMismatch(input.Measurements, measurements, "Measurements")
	}

	tattoos, _ := s.resolver.Performer().Tattoos(s.ctx, performer)
	if !compareBodyMods(input.Tattoos, tattoos) {
		s.fieldMismatch(input.Tattoos, tattoos, "Tattoos")
	}

	piercings, _ := s.resolver.Performer().Piercings(s.ctx, performer)
	if !compareBodyMods(input.Piercings, piercings) {
		s.fieldMismatch(input.Piercings, piercings, "Piercings")
	}
}

func (s *performerTestRunner) testDestroyPerformer() {
	createdPerformer, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}

	performerID := strconv.FormatInt(createdPerformer.ID, 10)

	destroyed, err := s.resolver.Mutation().PerformerDestroy(s.ctx, models.PerformerDestroyInput{
		ID: performerID,
	})
	if err != nil {
		s.t.Errorf("Error destroying performer: %s", err.Error())
		return
	}

	if !destroyed {
		s.t.Error("Performer was not destroyed")
		return
	}

	// ensure cannot find performer
	foundPerformer, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	if err != nil {
		s.t.Errorf("Error finding performer after destroying: %s", err.Error())
		return
	}

	if foundPerformer != nil {
		s.t.Error("Found performer after destruction")
	}

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

func TestUpdatePerformerName(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testUpdatePerformerName()
}

func TestDestroyPerformer(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testDestroyPerformer()
}
