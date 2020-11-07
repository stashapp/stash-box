package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/dataloader"
	"github.com/stashapp/stashdb/pkg/models"

	"github.com/gofrs/uuid"
)

/*
type PerformerEdit struct {
	Name              *string             `json:"name,omitempty"`
	Disambiguation    *string             `json:"disambiguation,omitempty"`
	AddedAliases      []string            `json:"added_aliases,omitempty"`
	RemovedAliases    []string            `json:"removed_aliases,omitempty"`
	Gender            *string             `json:"gender,omitempty"`
	AddedUrls         []*URL              `json:"added_urls,omitempty"`
	RemovedUrls       []*URL              `json:"removed_urls,omitempty"`
	Birthdate         *string             `json:"birthdate,omitempty"`
	BirthdateAccuracy *string             `json:"birthdate_accuracy,omitempty"`
	Ethnicity         *string             `json:"ethnicity,omitempty"`
	Country           *string             `json:"country,omitempty"`
	EyeColor          *string             `json:"eye_color,omitempty"`
	HairColor         *string             `json:"hair_color,omitempty"`
	Height            *int64              `json:"height,omitempty"`
	CupSize           *string             `json:"cup_size,omitempty"`
	BandSize          *int64              `json:"band_size,omitempty"`
	WaistSize         *int64              `json:"waist_size,omitempty"`
	HipSize           *int64              `json:"hip_size,omitempty"`
	BreastType        *string             `json:"breast_type,omitempty"`
	CareerStartYear   *int64              `json:"career_start_year,omitempty"`
	CareerEndYear     *int64              `json:"career_end_year,omitempty"`
	AddedTattoos      []*BodyModification `json:"added_tattoos,omitempty"`
	RemovedTattoos    []*BodyModification `json:"removed_tattoos,omitempty"`
	AddedPiercings    []*BodyModification `json:"added_piercings,omitempty"`
	RemovedPiercings  []*BodyModification `json:"removed_piercings,omitempty"`
	AddedImages       []string            `json:"added_images,omitempty"`
	RemovedImages     []string            `json:"removed_images,omitempty"`
}
*/

type performerEditResolver struct{ *Resolver }

func (r *performerEditResolver) Gender(ctx context.Context, obj *models.PerformerEdit) (*models.GenderEnum, error) {
	var ret models.GenderEnum
	if obj.Gender == nil || !resolveEnumString(*obj.Gender, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) HairColor(ctx context.Context, obj *models.PerformerEdit) (*models.HairColorEnum, error) {
	var ret models.HairColorEnum
	if obj.HairColor == nil || !resolveEnumString(*obj.HairColor, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) EyeColor(ctx context.Context, obj *models.PerformerEdit) (*models.EyeColorEnum, error) {
	var ret models.EyeColorEnum
	if obj.EyeColor == nil || !resolveEnumString(*obj.EyeColor, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) Ethnicity(ctx context.Context, obj *models.PerformerEdit) (*models.EthnicityEnum, error) {
	var ret models.EthnicityEnum
	if obj.Ethnicity == nil || !resolveEnumString(*obj.Ethnicity, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) BreastType(ctx context.Context, obj *models.PerformerEdit) (*models.BreastTypeEnum, error) {
	var ret models.BreastTypeEnum
	if obj.BreastType == nil || !resolveEnumString(*obj.BreastType, &ret) {
		return nil, nil
	}

	return &ret, nil
}

func (r *performerEditResolver) AddedImages(ctx context.Context, obj *models.PerformerEdit) ([]*models.Image, error) {
	var uuids []uuid.UUID
	for _, id := range obj.AddedImages {
		imageID, _ := uuid.FromString(id)
		uuids = append(uuids, imageID)
	}
	images, errors := dataloader.For(ctx).ImageById.LoadAll(uuids)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return images, nil
}

func (r *performerEditResolver) RemovedImages(ctx context.Context, obj *models.PerformerEdit) ([]*models.Image, error) {
	var uuids []uuid.UUID
	for _, id := range obj.RemovedImages {
		imageID, _ := uuid.FromString(id)
		uuids = append(uuids, imageID)
	}
	images, errors := dataloader.For(ctx).ImageById.LoadAll(uuids)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return images, nil
}
