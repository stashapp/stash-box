package models

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/utils"
	"github.com/stretchr/testify/assert"
)

var (
	aName        = "aName"
	bName        = "bName"
	aDescription = "aDescription"
	bDescription = "bDescription"
	aCategoryID  = uuid.FromStringOrNil("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	bCategoryID  = uuid.FromStringOrNil("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

	aDisambiguation = "aDisambiguation"
	bDisambiguation = "bDisambiguation"
	aGender         = GenderEnumMale
	bGender         = GenderEnumFemale
	aGenderStr      = aGender.String()
	bGenderStr      = bGender.String()
	aDate           = "2001-01-01"
	bDate           = "2002-01"
	dDate           = "2024-11"
	aEthnicity      = EthnicityEnumAsian
	bEthnicity      = EthnicityEnumBlack
	aEthnicityStr   = aEthnicity.String()
	bEthnicityStr   = bEthnicity.String()
	aCountry        = "aCountry"
	bCountry        = "bCountry"
	aEyeColor       = EyeColorEnumBlue
	bEyeColor       = EyeColorEnumBrown
	aEyeColorStr    = aEyeColor.String()
	bEyeColorStr    = bEyeColor.String()
	aHairColor      = HairColorEnumAuburn
	bHairColor      = HairColorEnumBlack
	aHairColorStr   = aHairColor.String()
	bHairColorStr   = bHairColor.String()
	aHeight         = 100
	bHeight         = 200
	aHeight64       = aHeight
	bHeight64       = bHeight
	aCupSize        = "aCupSize"
	bCupSize        = "bCupSize"
	aBandSize       = 30
	bBandSize       = 40
	aWaistSize      = 50
	bWaistSize      = 60
	aHipSize        = 70
	bHipSize        = 80
	aBandSize64     = aBandSize
	bBandSize64     = bBandSize
	aWaistSize64    = aWaistSize
	bWaistSize64    = bWaistSize
	aHipSize64      = aHipSize
	bHipSize64      = bHipSize
	aBreastType     = BreastTypeEnumFake
	bBreastType     = BreastTypeEnumNatural
	aBreastTypeStr  = aBreastType.String()
	bBreastTypeStr  = bBreastType.String()
	aStartYear      = 2001
	aEndYear        = 2002
	bStartYear      = 2003
	bEndYear        = 2004
	aStartYear64    = aStartYear
	aEndYear64      = aEndYear
	bStartYear64    = bStartYear
	bEndYear64      = bEndYear
)

var mockedArguments = utils.ArgumentsQuery{}

func TestTagEditFromDiff(t *testing.T) {
	orig := Tag{
		Name:        aName,
		Description: &aDescription,
		CategoryID:  uuid.NullUUID{UUID: aCategoryID, Valid: true},
	}
	input := TagEditDetailsInput{
		Name:        &bName,
		Description: &bDescription,
		CategoryID:  &bCategoryID,
	}

	out := input.TagEditFromDiff(orig, mockedArguments)

	assert.Equal(t, TagEditData{
		New: &TagEdit{
			Name:        &bName,
			Description: &bDescription,
			CategoryID:  &bCategoryID,
		},
		Old: &TagEdit{
			Name:        &aName,
			Description: &aDescription,
			CategoryID:  &aCategoryID,
		},
	}, out)

	emptyOrig := Tag{
		Name: aName,
	}

	out = input.TagEditFromDiff(emptyOrig, mockedArguments)
	assert.Equal(t, TagEditData{
		New: &TagEdit{
			Name:        &bName,
			Description: &bDescription,
			CategoryID:  &bCategoryID,
		},
		Old: &TagEdit{
			Name: &aName,
		},
	}, out)

	emptyInput := TagEditDetailsInput{}

	out = emptyInput.TagEditFromDiff(orig, mockedArguments)
	assert.Equal(t, TagEditData{
		New: &TagEdit{},
		Old: &TagEdit{},
	}, out)

	equalInput := TagEditDetailsInput{
		Name:        &aName,
		Description: &aDescription,
		CategoryID:  &aCategoryID,
	}

	out = equalInput.TagEditFromDiff(orig, mockedArguments)
	assert.Equal(t, TagEditData{
		New: &TagEdit{},
		Old: &TagEdit{},
	}, out)
}

func TestPerformerEditFromDiff(t *testing.T) {
	orig := Performer{
		Name:            aName,
		Disambiguation:  &aDisambiguation,
		Gender:          &aGender,
		BirthDate:       &aDate,
		Ethnicity:       &aEthnicity,
		Country:         &aCountry,
		EyeColor:        &aEyeColor,
		HairColor:       &aHairColor,
		Height:          &aHeight,
		CupSize:         &aCupSize,
		BandSize:        &aBandSize,
		WaistSize:       &aWaistSize,
		HipSize:         &aHipSize,
		BreastType:      &aBreastType,
		CareerStartYear: &aStartYear,
		CareerEndYear:   &aEndYear,
	}
	input := PerformerEditDetailsInput{
		Name:            &bName,
		Disambiguation:  &bDisambiguation,
		Gender:          &bGender,
		Birthdate:       &bDate,
		Deathdate:       &dDate,
		Ethnicity:       &bEthnicity,
		Country:         &bCountry,
		EyeColor:        &bEyeColor,
		HairColor:       &bHairColor,
		Height:          &bHeight,
		CupSize:         &bCupSize,
		BandSize:        &bBandSize,
		WaistSize:       &bWaistSize,
		HipSize:         &bHipSize,
		BreastType:      &bBreastType,
		CareerStartYear: &bStartYear,
		CareerEndYear:   &bEndYear,
	}

	out, _ := input.PerformerEditFromDiff(orig, mockedArguments)

	assert.Equal(t, PerformerEditData{
		New: &PerformerEdit{
			Name:            &bName,
			Disambiguation:  &bDisambiguation,
			Gender:          &bGenderStr,
			Birthdate:       &bDate,
			Deathdate:       &dDate,
			Ethnicity:       &bEthnicityStr,
			Country:         &bCountry,
			EyeColor:        &bEyeColorStr,
			HairColor:       &bHairColorStr,
			Height:          &bHeight64,
			CupSize:         &bCupSize,
			BandSize:        &bBandSize64,
			WaistSize:       &bWaistSize64,
			HipSize:         &bHipSize64,
			BreastType:      &bBreastTypeStr,
			CareerStartYear: &bStartYear64,
			CareerEndYear:   &bEndYear64,
		},
		Old: &PerformerEdit{
			Name:            &aName,
			Disambiguation:  &aDisambiguation,
			Gender:          &aGenderStr,
			Birthdate:       &aDate,
			Ethnicity:       &aEthnicityStr,
			Country:         &aCountry,
			EyeColor:        &aEyeColorStr,
			HairColor:       &aHairColorStr,
			Height:          &aHeight64,
			CupSize:         &aCupSize,
			BandSize:        &aBandSize64,
			WaistSize:       &aWaistSize64,
			HipSize:         &aHipSize64,
			BreastType:      &aBreastTypeStr,
			CareerStartYear: &aStartYear64,
			CareerEndYear:   &aEndYear64,
		},
	}, *out)

	emptyOrig := Performer{
		Name: aName,
	}

	out, _ = input.PerformerEditFromDiff(emptyOrig, mockedArguments)
	assert.Equal(t, PerformerEditData{
		New: &PerformerEdit{
			Name:            &bName,
			Disambiguation:  &bDisambiguation,
			Gender:          &bGenderStr,
			Birthdate:       &bDate,
			Deathdate:       &dDate,
			Ethnicity:       &bEthnicityStr,
			Country:         &bCountry,
			EyeColor:        &bEyeColorStr,
			HairColor:       &bHairColorStr,
			Height:          &bHeight64,
			CupSize:         &bCupSize,
			BandSize:        &bBandSize64,
			WaistSize:       &bWaistSize64,
			HipSize:         &bHipSize64,
			BreastType:      &bBreastTypeStr,
			CareerStartYear: &bStartYear64,
			CareerEndYear:   &bEndYear64,
		},
		Old: &PerformerEdit{
			Name: &aName,
		},
	}, *out)

	emptyInput := PerformerEditDetailsInput{}

	out, _ = emptyInput.PerformerEditFromDiff(orig, mockedArguments)
	assert.Equal(t, PerformerEditData{
		New: &PerformerEdit{},
		Old: &PerformerEdit{},
	}, *out)

	equalInput := PerformerEditDetailsInput{
		Name:            &aName,
		Disambiguation:  &aDisambiguation,
		Gender:          &aGender,
		Birthdate:       &aDate,
		Ethnicity:       &aEthnicity,
		Country:         &aCountry,
		EyeColor:        &aEyeColor,
		HairColor:       &aHairColor,
		Height:          &aHeight,
		CupSize:         &aCupSize,
		BandSize:        &aBandSize,
		WaistSize:       &aWaistSize,
		HipSize:         &aHipSize,
		BreastType:      &aBreastType,
		CareerStartYear: &aStartYear,
		CareerEndYear:   &aEndYear,
	}

	out, _ = equalInput.PerformerEditFromDiff(orig, mockedArguments)
	assert.Equal(t, PerformerEditData{
		New: &PerformerEdit{},
		Old: &PerformerEdit{},
	}, *out)
}
