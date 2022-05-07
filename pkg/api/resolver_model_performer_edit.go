package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
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

func (r *performerEditResolver) AddedImages(ctx context.Context, obj *models.PerformerEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.AddedImages)
}

func (r *performerEditResolver) RemovedImages(ctx context.Context, obj *models.PerformerEdit) ([]*models.Image, error) {
	return imageList(ctx, obj.RemovedImages)
}

func (r *performerEditResolver) Images(ctx context.Context, obj *models.PerformerEdit) ([]*models.Image, error) {
	fac := r.getRepoFactory(ctx)
	id, err := fac.Edit().FindPerformerID(obj.EditID)
	if err != nil {
		return nil, err
	}

	imageIds, err := fac.Performer().GetEditImages(*id, obj)
	if err != nil {
		return nil, err
	}
	images, errs := fac.Image().FindByIds(imageIds)
	if len(errs) > 0 {
		return nil, errs[0]
	}
	return images, nil
}

func (r *performerEditResolver) Urls(ctx context.Context, obj *models.PerformerEdit) ([]*models.URL, error) {
	fac := r.getRepoFactory(ctx)
	id, err := fac.Edit().FindPerformerID(obj.EditID)
	if err != nil {
		return nil, err
	}

	return fac.Performer().GetEditURLs(*id, obj)
}

func (r *performerEditResolver) Aliases(ctx context.Context, obj *models.PerformerEdit) ([]string, error) {
	fac := r.getRepoFactory(ctx)
	id, err := fac.Edit().FindPerformerID(obj.EditID)
	if err != nil {
		return nil, err
	}

	return fac.Performer().GetEditAliases(*id, obj)
}

func (r *performerEditResolver) Tattoos(ctx context.Context, obj *models.PerformerEdit) ([]*models.BodyModification, error) {
	fac := r.getRepoFactory(ctx)
	id, err := fac.Edit().FindPerformerID(obj.EditID)
	if err != nil {
		return nil, err
	}

	return fac.Performer().GetEditTattoos(*id, obj)
}

func (r *performerEditResolver) Piercings(ctx context.Context, obj *models.PerformerEdit) ([]*models.BodyModification, error) {
	fac := r.getRepoFactory(ctx)
	id, err := fac.Edit().FindPerformerID(obj.EditID)
	if err != nil {
		return nil, err
	}

	return fac.Performer().GetEditPiercings(*id, obj)
}
