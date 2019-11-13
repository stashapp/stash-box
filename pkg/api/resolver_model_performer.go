package api

import (
	"context"
	"strconv"
	"time"

	"github.com/stashapp/stashdb/pkg/models"
	"github.com/stashapp/stashdb/pkg/utils"
)

type performerResolver struct{ *Resolver }

func (r *performerResolver) ID(ctx context.Context, obj *models.Performer) (string, error) {
	return strconv.FormatInt(obj.ID, 10), nil
}

func (r *performerResolver) Disambiguation(ctx context.Context, obj *models.Performer) (*string, error) {
	return resolveNullString(obj.Disambiguation)
}

func (r *performerResolver) Aliases(ctx context.Context, obj *models.Performer) ([]string, error) {
	qb := models.NewPerformerQueryBuilder()
	aliases, err := qb.GetAliases(obj.ID)

	if err != nil {
		return nil, err
	}

	return aliases, nil
}

func (r *performerResolver) Gender(ctx context.Context, obj *models.Performer) (*models.GenderEnum, error) {
	var ret models.GenderEnum
	if !resolveEnum(obj.Gender, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerResolver) Urls(ctx context.Context, obj *models.Performer) ([]*models.URL, error) {
	qb := models.NewPerformerQueryBuilder()
	urls, err := qb.GetUrls(obj.ID)

	if err != nil {
		return nil, err
	}

	var ret []*models.URL
	for _, url := range urls {
		retURL := url.ToURL()
		ret = append(ret, &retURL)
	}

	return ret, nil
}

func (r *performerResolver) Birthdate(ctx context.Context, obj *models.Performer) (*models.FuzzyDate, error) {
	ret := obj.ResolveBirthdate()
	return &ret, nil
}

func (r *performerResolver) Age(ctx context.Context, obj *models.Performer) (*int, error) {
	if !obj.Birthdate.Valid {
		return nil, nil
	}

	birthdate, err := utils.ParseDateStringAsTime(obj.Birthdate.String)
	if err != nil {
		return nil, nil
	}

	birthYear := birthdate.Year()
	now := time.Now()
	thisYear := now.Year()
	age := thisYear - birthYear
	if now.YearDay() < birthdate.YearDay() {
		age = age - 1
	}

	return &age, nil
}

func (r *performerResolver) Ethnicity(ctx context.Context, obj *models.Performer) (*models.EthnicityEnum, error) {
	var ret models.EthnicityEnum
	if !resolveEnum(obj.Ethnicity, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerResolver) Country(ctx context.Context, obj *models.Performer) (*string, error) {
	return resolveNullString(obj.Country)
}

func (r *performerResolver) EyeColor(ctx context.Context, obj *models.Performer) (*models.EyeColorEnum, error) {
	var ret models.EyeColorEnum
	if !resolveEnum(obj.EyeColor, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerResolver) HairColor(ctx context.Context, obj *models.Performer) (*models.HairColorEnum, error) {
	var ret models.HairColorEnum
	if !resolveEnum(obj.HairColor, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerResolver) Height(ctx context.Context, obj *models.Performer) (*int, error) {
	return resolveNullInt64(obj.Height)
}

func (r *performerResolver) Measurements(ctx context.Context, obj *models.Performer) (*models.Measurements, error) {
	ret := obj.ResolveMeasurements()
	return &ret, nil
}

func (r *performerResolver) BreastType(ctx context.Context, obj *models.Performer) (*models.BreastTypeEnum, error) {
	var ret models.BreastTypeEnum
	if !resolveEnum(obj.BreastType, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerResolver) CareerStartYear(ctx context.Context, obj *models.Performer) (*int, error) {
	return resolveNullInt64(obj.CareerStartYear)
}

func (r *performerResolver) CareerEndYear(ctx context.Context, obj *models.Performer) (*int, error) {
	return resolveNullInt64(obj.CareerEndYear)
}

func (r *performerResolver) Tattoos(ctx context.Context, obj *models.Performer) ([]*models.BodyModification, error) {
	qb := models.NewPerformerQueryBuilder()
	tattoos, err := qb.GetTattoos(obj.ID)

	if err != nil {
		return nil, err
	}

	var ret []*models.BodyModification
	for _, tattoo := range tattoos {
		bodyMod := tattoo.ToBodyModification()
		ret = append(ret, &bodyMod)
	}

	return ret, nil
}

func (r *performerResolver) Piercings(ctx context.Context, obj *models.Performer) ([]*models.BodyModification, error) {
	qb := models.NewPerformerQueryBuilder()
	piercings, err := qb.GetPiercings(obj.ID)

	if err != nil {
		return nil, err
	}

	var ret []*models.BodyModification
	for _, piercing := range piercings {
		bodyMod := piercing.ToBodyModification()
		ret = append(ret, &bodyMod)
	}

	return ret, nil
}
