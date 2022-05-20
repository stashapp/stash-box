package api

import (
	"context"
	"sort"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type performerResolver struct{ *Resolver }

func (r *performerResolver) ID(ctx context.Context, obj *models.Performer) (string, error) {
	return obj.ID.String(), nil
}

func (r *performerResolver) Disambiguation(ctx context.Context, obj *models.Performer) (*string, error) {
	return resolveNullString(obj.Disambiguation), nil
}

func (r *performerResolver) Aliases(ctx context.Context, obj *models.Performer) ([]string, error) {
	aliases, err := dataloader.For(ctx).PerformerAliasesByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	sort.Strings(aliases)

	return aliases, nil
}

func (r *performerResolver) Gender(ctx context.Context, obj *models.Performer) (*models.GenderEnum, error) {
	var ret models.GenderEnum
	if !utils.ResolveEnum(obj.Gender, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerResolver) Urls(ctx context.Context, obj *models.Performer) ([]*models.URL, error) {
	return dataloader.For(ctx).PerformerUrlsByID.Load(obj.ID)
}

func (r *performerResolver) Birthdate(ctx context.Context, obj *models.Performer) (*models.FuzzyDate, error) {
	ret := obj.ResolveBirthdate()
	return &ret, nil
}

func (r *performerResolver) BirthDate(ctx context.Context, obj *models.Performer) (*string, error) {
	return resolveFuzzyDate(&obj.Birthdate.String, &obj.BirthdateAccuracy.String), nil
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
		age--
	}

	return &age, nil
}

func (r *performerResolver) Ethnicity(ctx context.Context, obj *models.Performer) (*models.EthnicityEnum, error) {
	var ret models.EthnicityEnum
	if !utils.ResolveEnum(obj.Ethnicity, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerResolver) Country(ctx context.Context, obj *models.Performer) (*string, error) {
	return resolveNullString(obj.Country), nil
}

func (r *performerResolver) EyeColor(ctx context.Context, obj *models.Performer) (*models.EyeColorEnum, error) {
	var ret models.EyeColorEnum
	if !utils.ResolveEnum(obj.EyeColor, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerResolver) HairColor(ctx context.Context, obj *models.Performer) (*models.HairColorEnum, error) {
	var ret models.HairColorEnum
	if !utils.ResolveEnum(obj.HairColor, &ret) {
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

func (r *performerResolver) CupSize(ctx context.Context, obj *models.Performer) (*string, error) {
	return resolveNullString(obj.CupSize), nil
}

func (r *performerResolver) BandSize(ctx context.Context, obj *models.Performer) (*int, error) {
	return resolveNullInt64(obj.BandSize)
}

func (r *performerResolver) WaistSize(ctx context.Context, obj *models.Performer) (*int, error) {
	return resolveNullInt64(obj.WaistSize)
}

func (r *performerResolver) HipSize(ctx context.Context, obj *models.Performer) (*int, error) {
	return resolveNullInt64(obj.HipSize)
}

func (r *performerResolver) BreastType(ctx context.Context, obj *models.Performer) (*models.BreastTypeEnum, error) {
	var ret models.BreastTypeEnum
	if !utils.ResolveEnum(obj.BreastType, &ret) {
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
	return dataloader.For(ctx).PerformerTattoosByID.Load(obj.ID)
}

func (r *performerResolver) Piercings(ctx context.Context, obj *models.Performer) ([]*models.BodyModification, error) {
	return dataloader.For(ctx).PerformerPiercingsByID.Load(obj.ID)
}

func (r *performerResolver) Images(ctx context.Context, obj *models.Performer) ([]*models.Image, error) {
	imageIDs, err := dataloader.For(ctx).PerformerImageIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}
	images, errors := dataloader.For(ctx).ImageByID.LoadAll(imageIDs)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	models.Images(images).OrderPortrait()
	return images, nil
}

func (r *performerResolver) Edits(ctx context.Context, obj *models.Performer) ([]*models.Edit, error) {
	eqb := r.getRepoFactory(ctx).Edit()
	return eqb.FindByPerformerID(obj.ID)
}

func (r *performerResolver) SceneCount(ctx context.Context, obj *models.Performer) (int, error) {
	sqb := r.getRepoFactory(ctx).Scene()
	return sqb.CountByPerformer(obj.ID)
}

func (r *performerResolver) MergedIds(ctx context.Context, obj *models.Performer) ([]uuid.UUID, error) {
	return dataloader.For(ctx).PerformerMergeIDsByID.Load(obj.ID)
}

func (r *performerResolver) Studios(ctx context.Context, obj *models.Performer) ([]*models.PerformerStudio, error) {
	sqb := r.getRepoFactory(ctx).Studio()
	return sqb.CountByPerformer(obj.ID)
}

func (r *performerResolver) IsFavorite(ctx context.Context, obj *models.Performer) (bool, error) {
	jqb := r.getRepoFactory(ctx).Joins()
	user := getCurrentUser(ctx)
	return jqb.IsPerformerFavorite(models.PerformerFavorite{PerformerID: obj.ID, UserID: user.ID})
}

func (r *performerResolver) Created(ctx context.Context, obj *models.Performer) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *performerResolver) Updated(ctx context.Context, obj *models.Performer) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}
