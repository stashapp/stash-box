package models

import (
	"database/sql"
	"testing"

	"gotest.tools/v3/assert"
)

func TestCopyFromPerformerEdit(t *testing.T) {
	input := PerformerEdit{
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
	}

	old := PerformerEdit{
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
	}

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

	origCopy := orig
	origCopy.CopyFromPerformerEdit(input, old)

	assert.DeepEqual(t, Performer{
		Name:              bName,
		Disambiguation:    sql.NullString{String: bDisambiguation, Valid: true},
		Gender:            sql.NullString{String: bGender.String(), Valid: true},
		Birthdate:         SQLDate{String: bDate, Valid: true},
		BirthdateAccuracy: sql.NullString{String: bDateAcc.String(), Valid: true},
		Ethnicity:         sql.NullString{String: bEthnicityStr, Valid: true},
		Country:           sql.NullString{String: bCountry, Valid: true},
		EyeColor:          sql.NullString{String: bEyeColorStr, Valid: true},
		HairColor:         sql.NullString{String: bHairColorStr, Valid: true},
		Height:            sql.NullInt64{Int64: int64(bHeight), Valid: true},
		CupSize:           sql.NullString{String: bCupSize, Valid: true},
		BandSize:          sql.NullInt64{Int64: int64(bBandSize), Valid: true},
		WaistSize:         sql.NullInt64{Int64: int64(bWaistSize), Valid: true},
		HipSize:           sql.NullInt64{Int64: int64(bHipSize), Valid: true},
		BreastType:        sql.NullString{String: bBreastType.String(), Valid: true},
		CareerStartYear:   sql.NullInt64{Int64: int64(bStartYear), Valid: true},
		CareerEndYear:     sql.NullInt64{Int64: int64(bEndYear), Valid: true},
		UpdatedAt:         origCopy.UpdatedAt,
	}, origCopy)

	origCopy = orig
	origCopy.CopyFromPerformerEdit(PerformerEdit{}, PerformerEdit{})

	orig.UpdatedAt = origCopy.UpdatedAt
	assert.DeepEqual(t, orig, origCopy)
}
