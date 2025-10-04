package api

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type performerResolver struct{ *Resolver }

func (r *performerResolver) ID(ctx context.Context, obj *models.Performer) (string, error) {
	return obj.ID.String(), nil
}

func (r *performerResolver) Aliases(ctx context.Context, obj *models.Performer) ([]string, error) {
	aliases, err := dataloader.For(ctx).PerformerAliasesByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}

	sort.Strings(aliases)

	return aliases, nil
}

func (r *performerResolver) Urls(ctx context.Context, obj *models.Performer) ([]models.URL, error) {
	return dataloader.For(ctx).PerformerUrlsByID.Load(obj.ID)
}

// Deprecated: use `BirthDate`
func (r *performerResolver) Birthdate(ctx context.Context, obj *models.Performer) (*models.FuzzyDate, error) {
	return resolveFuzzyDate(obj.BirthDate), nil
}

func (r *performerResolver) Age(ctx context.Context, obj *models.Performer) (*int, error) {
	if obj.BirthDate == nil {
		return nil, nil
	}

	birthdate, err := utils.ParseDateStringAsTime(*obj.BirthDate)
	if err != nil {
		return nil, nil
	}

	end := time.Now()
	if obj.DeathDate != nil {
		deathdate, err := utils.ParseDateStringAsTime(*obj.DeathDate)
		if err == nil {
			end = deathdate
		}
	}

	birthYear := birthdate.Year()
	thisYear := end.Year()
	age := thisYear - birthYear

	if end.YearDay() < birthdate.YearDay() {
		age--
	}

	return &age, nil
}

func (r *performerResolver) Measurements(ctx context.Context, obj *models.Performer) (*models.Measurements, error) {
	ret := models.Measurements{
		BandSize: obj.BandSize,
		CupSize:  obj.CupSize,
		Hip:      obj.HipSize,
		Waist:    obj.WaistSize,
	}
	return &ret, nil
}

func (r *performerResolver) Tattoos(ctx context.Context, obj *models.Performer) ([]models.BodyModification, error) {
	return dataloader.For(ctx).PerformerTattoosByID.Load(obj.ID)
}

func (r *performerResolver) Piercings(ctx context.Context, obj *models.Performer) ([]models.BodyModification, error) {
	return dataloader.For(ctx).PerformerPiercingsByID.Load(obj.ID)
}

func (r *performerResolver) Images(ctx context.Context, obj *models.Performer) ([]models.Image, error) {
	imageIDs, err := dataloader.For(ctx).PerformerImageIDsByID.Load(obj.ID)
	if err != nil {
		return nil, err
	}
	images, err := imageList(ctx, imageIDs)
	image.OrderPortrait(images)
	return images, nil
}

func (r *performerResolver) Edits(ctx context.Context, obj *models.Performer) ([]models.Edit, error) {
	return r.services.Edit().FindByPerformerID(ctx, obj.ID)
}

func (r *performerResolver) SceneCount(ctx context.Context, obj *models.Performer) (int, error) {
	return r.services.Scene().CountByPerformer(ctx, obj.ID)
}

func (r *performerResolver) Scenes(ctx context.Context, obj *models.Performer, input *models.PerformerScenesInput) ([]models.Scene, error) {
	performers := []uuid.UUID{
		obj.ID,
	}
	if input != nil && input.PerformedWith != nil {
		performers = append(performers, *input.PerformedWith)
	}

	var studios *models.MultiIDCriterionInput
	if input != nil && input.StudioID != nil {
		studios = &models.MultiIDCriterionInput{
			Modifier: models.CriterionModifierIncludes,
			Value:    []uuid.UUID{*input.StudioID},
		}
	}

	var tags *models.MultiIDCriterionInput
	if input != nil {
		tags = input.Tags
	}

	filter := models.SceneQueryInput{
		Performers: &models.MultiIDCriterionInput{
			Modifier: models.CriterionModifierIncludesAll,
			Value:    performers,
		},
		Studios:   studios,
		Tags:      tags,
		Sort:      "DATE",
		Direction: "DESC",
		Page:      1,
		PerPage:   10,
	}

	return r.services.Scene().Query(ctx, filter)
}

func (r *performerResolver) MergedIds(ctx context.Context, obj *models.Performer) ([]uuid.UUID, error) {
	return dataloader.For(ctx).PerformerMergeIDsByID.Load(obj.ID)
}

func (r *performerResolver) MergedIntoID(ctx context.Context, obj *models.Performer) (*uuid.UUID, error) {
	res, err := dataloader.For(ctx).PerformerMergeIDsBySourceID.Load(obj.ID)
	if len(res) == 1 {
		return &res[0], err
	} else if err != nil && len(res) > 1 {
		return nil, fmt.Errorf("invalid number of results returned, expecting exactly 1, found %d", len(res))
	}
	return nil, err
}

func (r *performerResolver) Studios(ctx context.Context, obj *models.Performer) ([]models.PerformerStudio, error) {
	return r.services.Studio().CountByPerformer(ctx, obj.ID)
}

func (r *performerResolver) IsFavorite(ctx context.Context, obj *models.Performer) (bool, error) {
	return dataloader.For(ctx).PerformerIsFavoriteByID.Load(obj.ID)
}
