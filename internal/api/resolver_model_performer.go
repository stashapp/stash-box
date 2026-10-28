package api

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/image"
	"github.com/stashapp/stash-box/internal/models"
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

// gallery is a performer's images with everything that decides their order
type gallery struct {
	images      []models.Image
	assignments []models.ImageTypeAssignment
	// Keyed by image id, and absent for an image nobody has dated
	dates map[uuid.UUID]*string
}

// loadGallery loads images and their ranking data through the request dataloaders.
func loadGallery(ctx context.Context, performerID uuid.UUID) (gallery, error) {
	imageIDs, err := dataloader.For(ctx).PerformerImageIDsByID.Load(performerID)
	if err != nil {
		return gallery{}, err
	}

	images, err := imageList(ctx, imageIDs)
	if err != nil {
		return gallery{}, err
	}

	assignmentLists, errs := dataloader.For(ctx).ImageTypesByID.LoadAll(imageIDs)
	for _, err := range errs {
		if err != nil {
			return gallery{}, err
		}
	}

	var assignments []models.ImageTypeAssignment
	for _, list := range assignmentLists {
		assignments = append(assignments, list...)
	}

	dates := make(map[uuid.UUID]*string, len(images))
	for i := range images {
		if images[i].Date != nil {
			dates[images[i].ID] = images[i].Date
		}
	}

	return gallery{images: images, assignments: assignments, dates: dates}, nil
}

func (r *performerResolver) Images(ctx context.Context, obj *models.Performer) ([]models.Image, error) {
	g, err := loadGallery(ctx, obj.ID)
	if err != nil {
		return nil, err
	}

	var ranks map[uuid.UUID]image.RankTuple
	if len(g.assignments) > 0 {
		vocabulary, err := dataloader.For(ctx).UserImageTypeVocabulary()
		if err != nil {
			return nil, err
		}
		ranks = vocabulary.RanksByImage(g.assignments)
	}

	// Sorted by the viewer's preferences, then organized, date, and shape.
	image.OrderByType(g.images, ranks, image.OrganizedFirst(image.NewestFirst(g.dates, image.OrderPortrait)))

	return g.images, nil
}

func (r *performerResolver) Thumbnail(ctx context.Context, obj *models.Performer) (*models.Image, error) {
	g, err := loadGallery(ctx, obj.ID)
	if err != nil {
		return nil, err
	}

	if len(g.images) == 0 {
		return nil, nil
	}

	var ranks map[uuid.UUID]image.RankTuple
	if len(g.assignments) > 0 {
		vocabulary, err := r.services.ImageType().InstanceVocabulary(ctx)
		if err != nil {
			return nil, err
		}

		// Thumbnails use the instance ordering with a preference for face crops.
		ranks = vocabulary.ThumbnailRanksByImage(g.assignments)
	}

	// Break ranking ties by organized status, date, and shape, as in Images.
	image.OrderByType(g.images, ranks, image.OrganizedFirst(image.NewestFirst(g.dates, image.OrderPortrait)))

	return &g.images[0], nil
}

func (r *performerResolver) Edits(ctx context.Context, obj *models.Performer) ([]models.Edit, error) {
	return r.services.Edit().FindByPerformerID(ctx, obj.ID)
}

func (r *performerResolver) SceneCount(ctx context.Context, obj *models.Performer) (int, error) {
	return dataloader.For(ctx).PerformerSceneCountByID.Load(obj.ID)
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

func (r *performerResolver) QueryScenes(ctx context.Context, obj *models.Performer, input models.SceneQueryInput) (*models.SceneQuery, error) {
	return &models.SceneQuery{
		Filter:      input,
		PerformerID: &obj.ID,
	}, nil
}

func (r *performerResolver) MergedIds(ctx context.Context, obj *models.Performer) ([]uuid.UUID, error) {
	return dataloader.For(ctx).PerformerMergeIDsBySourceID.Load(obj.ID)
}

func (r *performerResolver) MergedIntoID(ctx context.Context, obj *models.Performer) (*uuid.UUID, error) {
	res, err := dataloader.For(ctx).PerformerMergeIDsByID.Load(obj.ID)
	if len(res) == 1 {
		return &res[0], err
	} else if err != nil && len(res) > 1 {
		return nil, fmt.Errorf("invalid number of results returned, expecting exactly 1, found %d", len(res))
	}
	return nil, err
}

func (r *performerResolver) Studios(ctx context.Context, obj *models.Performer, studioID *uuid.UUID) ([]models.PerformerStudio, error) {
	return r.services.Studio().CountByPerformer(ctx, obj.ID, studioID)
}

func (r *performerResolver) IsFavorite(ctx context.Context, obj *models.Performer) (bool, error) {
	return dataloader.For(ctx).PerformerIsFavoriteByID.Load(obj.ID)
}
