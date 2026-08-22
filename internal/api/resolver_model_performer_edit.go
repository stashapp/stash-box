package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type performerEditResolver struct{ *Resolver }

func (r *performerEditResolver) Gender(ctx context.Context, obj *models.PerformerEdit) (*models.GenderEnum, error) {
	var ret models.GenderEnum
	if obj.Gender == nil || !utils.ResolveEnumString(*obj.Gender, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) HairColor(ctx context.Context, obj *models.PerformerEdit) (*models.HairColorEnum, error) {
	var ret models.HairColorEnum
	if obj.HairColor == nil || !utils.ResolveEnumString(*obj.HairColor, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) EyeColor(ctx context.Context, obj *models.PerformerEdit) (*models.EyeColorEnum, error) {
	var ret models.EyeColorEnum
	if obj.EyeColor == nil || !utils.ResolveEnumString(*obj.EyeColor, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) Ethnicity(ctx context.Context, obj *models.PerformerEdit) (*models.EthnicityEnum, error) {
	var ret models.EthnicityEnum
	if obj.Ethnicity == nil || !utils.ResolveEnumString(*obj.Ethnicity, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) BreastType(ctx context.Context, obj *models.PerformerEdit) (*models.BreastTypeEnum, error) {
	var ret models.BreastTypeEnum
	if obj.BreastType == nil || !utils.ResolveEnumString(*obj.BreastType, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) AddedImages(ctx context.Context, obj *models.PerformerEdit) ([]models.Image, error) {
	return imageList(ctx, obj.AddedImages)
}

func (r *performerEditResolver) RemovedImages(ctx context.Context, obj *models.PerformerEdit) ([]models.Image, error) {
	return imageList(ctx, obj.RemovedImages)
}

// ImageChanges regroups the edit's flat label tuples and date overrides into
// one entry per affected image, which is the unit a reviewer reads.
func (r *performerEditResolver) ImageChanges(ctx context.Context, obj *models.PerformerEdit) ([]models.ImageAssignmentChange, error) {
	// Preserve first-seen order so the list is stable between renders rather
	// than following Go's map iteration.
	var order []uuid.UUID
	changes := make(map[uuid.UUID]*models.ImageAssignmentChange)

	forImage := func(imageID uuid.UUID) *models.ImageAssignmentChange {
		change, seen := changes[imageID]
		if !seen {
			change = &models.ImageAssignmentChange{}
			changes[imageID] = change
			order = append(order, imageID)
		}
		return change
	}

	for _, added := range obj.AddedImageTypes {
		change := forImage(added.ImageID)
		change.AddedTypes = append(change.AddedTypes, added.Type)
	}

	for _, removed := range obj.RemovedImageTypes {
		change := forImage(removed.ImageID)
		change.RemovedTypes = append(change.RemovedTypes, removed.Type)
	}

	// An image arriving with this edit had no date on this performer to begin
	// with, so an entry saying null is not a date being taken away. The form
	// restates every image's date on every save, so a newly added image with
	// no date produces exactly that entry, and reporting it as a change had
	// reviewers reading "Date cleared" against a picture that never had one.
	//
	// Only the added case is caught, and deliberately. Telling whether a date
	// really changed on an image the performer already had would mean
	// comparing against the current value, which is right while the edit is
	// pending and wrong once it is applied -- the current value is then the
	// edit's own. A diff has to read the same before and after applying, and
	// nothing records what the date was at submission.
	added := make(map[uuid.UUID]struct{}, len(obj.AddedImages))
	for _, imageID := range obj.AddedImages {
		added[imageID] = struct{}{}
	}

	for _, date := range obj.ImageDates {
		if _, isNew := added[date.ImageID]; isNew && date.Date == nil {
			continue
		}
		change := forImage(date.ImageID)
		change.DateChanged = true
		change.Date = date.Date
	}

	if len(order) == 0 {
		return nil, nil
	}

	images, err := imageList(ctx, order)
	if err != nil {
		return nil, err
	}

	byID := make(map[uuid.UUID]models.Image, len(images))
	for _, image := range images {
		byID[image.ID] = image
	}

	result := make([]models.ImageAssignmentChange, 0, len(order))
	for _, imageID := range order {
		image, found := byID[imageID]
		if !found {
			// Garbage-collected since the edit was submitted; nothing useful
			// to show a reviewer.
			continue
		}

		change := changes[imageID]
		change.Image = &image
		result = append(result, *change)
	}

	return result, nil
}

func (r *performerEditResolver) Images(ctx context.Context, obj *models.PerformerEdit) ([]models.Image, error) {
	return r.services.Edit().GetMergedImages(ctx, obj.EditID)
}

func (r *performerEditResolver) TypedImages(ctx context.Context, obj *models.PerformerEdit) ([]models.TypedImage, error) {
	return r.services.Edit().GetMergedTypedImages(ctx, obj.EditID)
}

func (r *performerEditResolver) Urls(ctx context.Context, obj *models.PerformerEdit) ([]models.URL, error) {
	return r.services.Edit().GetMergedURLs(ctx, obj.EditID)
}

func (r *performerEditResolver) Aliases(ctx context.Context, obj *models.PerformerEdit) ([]string, error) {
	return r.services.Edit().GetMergedPerformerAliases(ctx, obj.EditID)
}

func (r *performerEditResolver) Tattoos(ctx context.Context, obj *models.PerformerEdit) ([]models.BodyModification, error) {
	return r.services.Edit().GetMergedPerformerTattoos(ctx, obj.EditID)
}

func (r *performerEditResolver) Piercings(ctx context.Context, obj *models.PerformerEdit) ([]models.BodyModification, error) {
	return r.services.Edit().GetMergedPerformerPiercings(ctx, obj.EditID)
}
