package models

import (
	"errors"
)

func (e TagEditDetailsInput) TagEditFromDiff(orig Tag) TagEditData {
	newData := &TagEdit{}
	oldData := &TagEdit{}

	if e.Name != nil && *e.Name != orig.Name {
		newName := *e.Name
		newData.Name = &newName
		oldData.Name = &orig.Name
	}

	if e.Description != nil && (!orig.Description.Valid || *e.Description != orig.Description.String) {
		newDesc := *e.Description
		newData.Description = &newDesc
		if orig.Description.Valid {
			oldData.Description = &orig.Description.String
		}
	}

	if e.CategoryID == nil && orig.CategoryID.Valid {
		oldCategory := orig.CategoryID.UUID.String()
		oldData.CategoryID = &oldCategory
	} else if e.CategoryID != nil && (!orig.CategoryID.Valid || *e.CategoryID != orig.CategoryID.UUID.String()) {
		newCategory := *e.CategoryID
		newData.CategoryID = &newCategory
		if orig.CategoryID.Valid {
			oldCategory := orig.CategoryID.UUID.String()
			oldData.CategoryID = &oldCategory
		}
	}

	return TagEditData{
		New: newData,
		Old: oldData,
	}
}

func (e TagEditDetailsInput) TagEditFromMerge(orig Tag, sources []string) TagEditData {
	data := e.TagEditFromDiff(orig)
	data.MergeSources = sources

	return data
}

func (e TagEditDetailsInput) TagEditFromCreate() TagEditData {
	newData := &TagEdit{}

	if e.Name != nil {
		newName := *e.Name
		newData.Name = &newName
	}

	if e.Description != nil {
		newDesc := *e.Description
		newData.Description = &newDesc
	}

	if e.CategoryID != nil {
		newCategory := *e.CategoryID
		newData.CategoryID = &newCategory
	}

	return TagEditData{
		New: newData,
	}
}

func (e PerformerEditDetailsInput) PerformerEditFromDiff(orig Performer) PerformerEditData {
	newData := &PerformerEdit{}
	oldData := &PerformerEdit{}

	if e.Name != nil && *e.Name != orig.Name {
		newName := *e.Name
		newData.Name = &newName
		oldData.Name = &orig.Name
	}

	if e.Disambiguation != nil && (!orig.Disambiguation.Valid || *e.Disambiguation != orig.Disambiguation.String) {
		newDisambiguation := *e.Disambiguation
		newData.Disambiguation = &newDisambiguation
		oldData.Disambiguation = &orig.Disambiguation.String
	}

	if e.Gender == nil && orig.Gender.Valid {
		newData.Gender = nil
		oldData.Gender = &orig.Gender.String
	} else if e.Gender != nil && (!orig.Gender.Valid || e.Gender.String() != orig.Gender.String) {
		newGender := e.Gender.String()
		newData.Gender = &newGender
		oldData.Gender = &orig.Gender.String
	}

	if e.Birthdate != nil && (!orig.Birthdate.Valid || (e.Birthdate.Date != orig.Birthdate.String && e.Birthdate.Accuracy.String() != orig.BirthdateAccuracy.String)) {
		newData.Birthdate = &e.Birthdate.Date
		newAccuracy := e.Birthdate.Accuracy.String()
		newData.BirthdateAccuracy = &newAccuracy
		oldData.Birthdate = &orig.Birthdate.String
		oldData.BirthdateAccuracy = &orig.BirthdateAccuracy.String
	}

	if e.Ethnicity != nil && (!orig.Ethnicity.Valid || e.Ethnicity.String() != orig.Ethnicity.String) {
		newEthnicity := e.Ethnicity.String()
		newData.Ethnicity = &newEthnicity
		oldData.Ethnicity = &orig.Ethnicity.String
	}

	if e.Country != nil && (!orig.Country.Valid || *e.Country != orig.Country.String) {
		newCountry := *e.Country
		newData.Country = &newCountry
		oldData.Country = &orig.Country.String
	}

	if e.EyeColor != nil && (!orig.EyeColor.Valid || e.EyeColor.String() != orig.EyeColor.String) {
		newEyeColor := e.EyeColor.String()
		newData.EyeColor = &newEyeColor
		oldData.EyeColor = &orig.EyeColor.String
	}

	if e.HairColor != nil && (!orig.HairColor.Valid || e.HairColor.String() != orig.HairColor.String) {
		newHairColor := e.HairColor.String()
		newData.HairColor = &newHairColor
		oldData.HairColor = &orig.HairColor.String
	}

	if e.Height != nil && (!orig.Height.Valid || int64(*e.Height) != orig.Height.Int64) {
		newHeight := int64(*e.Height)
		newData.Height = &newHeight
		oldData.Height = &orig.Height.Int64
	}

	if e.Measurements != nil {
		if e.Measurements.CupSize != nil && (!orig.CupSize.Valid || *e.Measurements.CupSize != orig.CupSize.String) {
			newCup := *e.Measurements.CupSize
			newData.CupSize = &newCup
			oldData.CupSize = &orig.CupSize.String
		}

		if e.Measurements.BandSize != nil && (!orig.BandSize.Valid || int64(*e.Measurements.BandSize) != orig.BandSize.Int64) {
			newBand := int64(*e.Measurements.BandSize)
			newData.BandSize = &newBand
			oldData.BandSize = &orig.BandSize.Int64
		}

		if e.Measurements.Waist != nil && (!orig.WaistSize.Valid || int64(*e.Measurements.Waist) != orig.WaistSize.Int64) {
			newWaist := int64(*e.Measurements.Waist)
			newData.WaistSize = &newWaist
			oldData.WaistSize = &orig.WaistSize.Int64
		}

		if e.Measurements.Hip != nil && (!orig.HipSize.Valid || int64(*e.Measurements.Hip) != orig.HipSize.Int64) {
			newHip := int64(*e.Measurements.Hip)
			newData.HipSize = &newHip
			oldData.HipSize = &orig.HipSize.Int64
		}
	}

	if e.BreastType != nil && (!orig.BreastType.Valid || e.BreastType.String() != orig.BreastType.String) {
		newBreastType := e.BreastType.String()
		newData.BreastType = &newBreastType
		oldData.BreastType = &orig.BreastType.String
	}

	if e.CareerStartYear != nil && (!orig.CareerStartYear.Valid || int64(*e.CareerStartYear) != orig.CareerStartYear.Int64) {
		newCareerStartYear := int64(*e.CareerStartYear)
		newData.CareerStartYear = &newCareerStartYear
		oldData.CareerStartYear = &orig.CareerStartYear.Int64
	}

	if e.CareerEndYear != nil && (!orig.CareerEndYear.Valid || int64(*e.CareerEndYear) != orig.CareerEndYear.Int64) {
		newCareerStartEnd := int64(*e.CareerEndYear)
		newData.CareerEndYear = &newCareerStartEnd
		oldData.CareerEndYear = &orig.CareerEndYear.Int64
	}

	return PerformerEditData{
		New: newData,
		Old: oldData,
	}
}

func (e PerformerEditDetailsInput) PerformerEditFromMerge(orig Performer, sources []string) PerformerEditData {
	data := e.PerformerEditFromDiff(orig)
	data.MergeSources = sources

	return data
}

func (e PerformerEditDetailsInput) PerformerEditFromCreate() PerformerEditData {
	newData := &PerformerEdit{}

	if e.Name != nil {
		newName := *e.Name
		newData.Name = &newName
	}

	if e.Disambiguation != nil {
		newDisambiguation := *e.Disambiguation
		newData.Disambiguation = &newDisambiguation
	}

	if e.Gender != nil {
		newGender := e.Gender.String()
		newData.Gender = &newGender
	}

	if e.Birthdate != nil {
		newData.Birthdate = &e.Birthdate.Date
		newAccuracy := e.Birthdate.Accuracy.String()
		newData.BirthdateAccuracy = &newAccuracy
	}

	if e.Ethnicity != nil {
		newEthnicity := e.Ethnicity.String()
		newData.Ethnicity = &newEthnicity
	}

	if e.Country != nil {
		newCountry := *e.Country
		newData.Country = &newCountry
	}

	if e.EyeColor != nil {
		newEyeColor := e.EyeColor.String()
		newData.EyeColor = &newEyeColor
	}

	if e.HairColor != nil {
		newHairColor := e.HairColor.String()
		newData.HairColor = &newHairColor
	}

	if e.Height != nil {
		newHeight := int64(*e.Height)
		newData.Height = &newHeight
	}

	if e.Measurements != nil {
		if e.Measurements.CupSize != nil {
			newCup := *e.Measurements.CupSize
			newData.CupSize = &newCup
		}

		if e.Measurements.BandSize != nil {
			newBand := int64(*e.Measurements.BandSize)
			newData.BandSize = &newBand
		}

		if e.Measurements.Waist != nil {
			newWaist := int64(*e.Measurements.Waist)
			newData.WaistSize = &newWaist
		}

		if e.Measurements.Hip != nil {
			newHip := int64(*e.Measurements.Hip)
			newData.HipSize = &newHip
		}
	}

	if e.BreastType != nil {
		newBreastType := e.BreastType.String()
		newData.BreastType = &newBreastType
	}

	if e.CareerStartYear != nil {
		newCareerStartYear := int64(*e.CareerStartYear)
		newData.CareerStartYear = &newCareerStartYear
	}

	if e.CareerEndYear != nil {
		newCareerStartEnd := int64(*e.CareerEndYear)
		newData.CareerEndYear = &newCareerStartEnd
	}

	return PerformerEditData{
		New: newData,
	}
}

type EditSliceValue interface {
	ID() string
}

type EditSlice interface {
	Each(fn func(interface{}))
	EachPtr(fn func(interface{}))
	Add(o interface{})
	Remove(v string)
}

func ProcessSlice(current EditSlice, added EditSlice, removed EditSlice) error {
	idMap := map[string]bool{}
	current.Each(func(v interface{}) {
		idMap[v.(EditSliceValue).ID()] = true
	})

	var err error

	removed.Each(func(v interface{}) {
		id := v.(EditSliceValue).ID()
		if !idMap[id] {
			err = errors.New("Invalid removal. ID does not exist: '" + id + "'")
		}
		current.Remove(id)
		idMap[id] = false
	})

	added.EachPtr(func(v interface{}) {
		id := v.(EditSliceValue).ID()
		if idMap[id] {
			err = errors.New("Invalid addition. ID already exists '" + id + "'")
		}
		current.Add(v)
		idMap[id] = true
	})

	return err
}
