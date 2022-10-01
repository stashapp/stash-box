package models

import (
	"database/sql"
	"testing"

	"github.com/gofrs/uuid"
	"gotest.tools/v3/assert"
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
	bDate           = "2002-01-01"
	aDateShort      = "2001-01-01"
	bDateShort      = "2002-01"
	aDateAcc        = DateAccuracyEnumDay
	bDateAcc        = DateAccuracyEnumMonth
	aDateAccStr     = aDateAcc.String()
	bDateAccStr     = bDateAcc.String()
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
	aHeight64       = int64(aHeight)
	bHeight64       = int64(bHeight)
	aCupSize        = "aCupSize"
	bCupSize        = "bCupSize"
	aBandSize       = 30
	bBandSize       = 40
	aWaistSize      = 50
	bWaistSize      = 60
	aHipSize        = 70
	bHipSize        = 80
	aBandSize64     = int64(aBandSize)
	bBandSize64     = int64(bBandSize)
	aWaistSize64    = int64(aWaistSize)
	bWaistSize64    = int64(bWaistSize)
	aHipSize64      = int64(aHipSize)
	bHipSize64      = int64(bHipSize)
	aBreastType     = BreastTypeEnumFake
	bBreastType     = BreastTypeEnumNatural
	aBreastTypeStr  = aBreastType.String()
	bBreastTypeStr  = bBreastType.String()
	aStartYear      = 2001
	aEndYear        = 2002
	bStartYear      = 2003
	bEndYear        = 2004
	aStartYear64    = int64(aStartYear)
	aEndYear64      = int64(aEndYear)
	bStartYear64    = int64(bStartYear)
	bEndYear64      = int64(bEndYear)
)

func TestTagEditFromDiff(t *testing.T) {
	orig := Tag{
		Name:        aName,
		Description: sql.NullString{String: aDescription, Valid: true},
		CategoryID:  uuid.NullUUID{UUID: aCategoryID, Valid: true},
	}
	input := TagEditDetailsInput{
		Name:        &bName,
		Description: &bDescription,
		CategoryID:  &bCategoryID,
	}

	out := input.TagEditFromDiff(orig)

	assert.DeepEqual(t, TagEditData{
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

	out = input.TagEditFromDiff(emptyOrig)
	assert.DeepEqual(t, TagEditData{
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

	out = emptyInput.TagEditFromDiff(orig)
	assert.DeepEqual(t, TagEditData{
		New: &TagEdit{},
		Old: &TagEdit{
			Name:        &aName,
			Description: &aDescription,
			CategoryID:  &aCategoryID,
		},
	}, out)

	equalInput := TagEditDetailsInput{
		Name:        &aName,
		Description: &aDescription,
		CategoryID:  &aCategoryID,
	}

	out = equalInput.TagEditFromDiff(orig)
	assert.DeepEqual(t, TagEditData{
		New: &TagEdit{},
		Old: &TagEdit{},
	}, out)
}

func TestPerformerEditFromDiff(t *testing.T) {
	orig := Performer{
		Name:              aName,
		Disambiguation:    sql.NullString{String: aDisambiguation, Valid: true},
		Gender:            sql.NullString{String: aGender.String(), Valid: true},
		Birthdate:         SQLDate{String: aDate, Valid: true},
		BirthdateAccuracy: sql.NullString{String: aDateAcc.String(), Valid: true},
		Ethnicity:         sql.NullString{String: aEthnicityStr, Valid: true},
		Country:           sql.NullString{String: aCountry, Valid: true},
		EyeColor:          sql.NullString{String: aEyeColorStr, Valid: true},
		HairColor:         sql.NullString{String: aHairColorStr, Valid: true},
		Height:            sql.NullInt64{Int64: int64(aHeight), Valid: true},
		CupSize:           sql.NullString{String: aCupSize, Valid: true},
		BandSize:          sql.NullInt64{Int64: int64(aBandSize), Valid: true},
		WaistSize:         sql.NullInt64{Int64: int64(aWaistSize), Valid: true},
		HipSize:           sql.NullInt64{Int64: int64(aHipSize), Valid: true},
		BreastType:        sql.NullString{String: aBreastType.String(), Valid: true},
		CareerStartYear:   sql.NullInt64{Int64: int64(aStartYear), Valid: true},
		CareerEndYear:     sql.NullInt64{Int64: int64(aEndYear), Valid: true},
	}
	input := PerformerEditDetailsInput{
		Name:            &bName,
		Disambiguation:  &bDisambiguation,
		Gender:          &bGender,
		Birthdate:       &bDateShort,
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

	out, _ := input.PerformerEditFromDiff(orig)

	assert.DeepEqual(t, PerformerEditData{
		New: &PerformerEdit{
			Name:              &bName,
			Disambiguation:    &bDisambiguation,
			Gender:            &bGenderStr,
			Birthdate:         &bDate,
			BirthdateAccuracy: &bDateAccStr,
			Ethnicity:         &bEthnicityStr,
			Country:           &bCountry,
			EyeColor:          &bEyeColorStr,
			HairColor:         &bHairColorStr,
			Height:            &bHeight64,
			CupSize:           &bCupSize,
			BandSize:          &bBandSize64,
			WaistSize:         &bWaistSize64,
			HipSize:           &bHipSize64,
			BreastType:        &bBreastTypeStr,
			CareerStartYear:   &bStartYear64,
			CareerEndYear:     &bEndYear64,
		},
		Old: &PerformerEdit{
			Name:              &aName,
			Disambiguation:    &aDisambiguation,
			Gender:            &aGenderStr,
			Birthdate:         &aDate,
			BirthdateAccuracy: &aDateAccStr,
			Ethnicity:         &aEthnicityStr,
			Country:           &aCountry,
			EyeColor:          &aEyeColorStr,
			HairColor:         &aHairColorStr,
			Height:            &aHeight64,
			CupSize:           &aCupSize,
			BandSize:          &aBandSize64,
			WaistSize:         &aWaistSize64,
			HipSize:           &aHipSize64,
			BreastType:        &aBreastTypeStr,
			CareerStartYear:   &aStartYear64,
			CareerEndYear:     &aEndYear64,
		},
	}, *out)

	emptyOrig := Performer{
		Name: aName,
	}

	out, _ = input.PerformerEditFromDiff(emptyOrig)
	assert.DeepEqual(t, PerformerEditData{
		New: &PerformerEdit{
			Name:              &bName,
			Disambiguation:    &bDisambiguation,
			Gender:            &bGenderStr,
			Birthdate:         &bDate,
			BirthdateAccuracy: &bDateAccStr,
			Ethnicity:         &bEthnicityStr,
			Country:           &bCountry,
			EyeColor:          &bEyeColorStr,
			HairColor:         &bHairColorStr,
			Height:            &bHeight64,
			CupSize:           &bCupSize,
			BandSize:          &bBandSize64,
			WaistSize:         &bWaistSize64,
			HipSize:           &bHipSize64,
			BreastType:        &bBreastTypeStr,
			CareerStartYear:   &bStartYear64,
			CareerEndYear:     &bEndYear64,
		},
		Old: &PerformerEdit{
			Name: &aName,
		},
	}, *out)

	emptyInput := PerformerEditDetailsInput{}

	out, _ = emptyInput.PerformerEditFromDiff(orig)
	assert.DeepEqual(t, PerformerEditData{
		New: &PerformerEdit{},
		Old: &PerformerEdit{
			Name:              &aName,
			Disambiguation:    &aDisambiguation,
			Gender:            &aGenderStr,
			Birthdate:         &aDate,
			BirthdateAccuracy: &aDateAccStr,
			Ethnicity:         &aEthnicityStr,
			Country:           &aCountry,
			EyeColor:          &aEyeColorStr,
			HairColor:         &aHairColorStr,
			Height:            &aHeight64,
			CupSize:           &aCupSize,
			BandSize:          &aBandSize64,
			WaistSize:         &aWaistSize64,
			HipSize:           &aHipSize64,
			BreastType:        &aBreastTypeStr,
			CareerStartYear:   &aStartYear64,
			CareerEndYear:     &aEndYear64,
		},
	}, *out)

	equalInput := PerformerEditDetailsInput{
		Name:            &aName,
		Disambiguation:  &aDisambiguation,
		Gender:          &aGender,
		Birthdate:       &aDateShort,
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

	out, _ = equalInput.PerformerEditFromDiff(orig)
	assert.DeepEqual(t, PerformerEditData{
		New: &PerformerEdit{},
		Old: &PerformerEdit{},
	}, *out)
}
