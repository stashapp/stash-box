package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/draft"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) SubmitSceneDraft(ctx context.Context, input models.SceneDraftInput) (*models.DraftSubmissionStatus, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	currentUser := getCurrentUser(ctx)
	newDraft := models.NewDraft(UUID, currentUser, models.TargetTypeEnumScene)

	var fingerprints []models.DraftFingerprint
	for _, fp := range input.Fingerprints {
		fingerprints = append(fingerprints, models.DraftFingerprint{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		})
	}

	data := models.SceneDraft{
		Title:        input.Title,
		Details:      input.Details,
		URL:          input.URL,
		Date:         input.Date,
		Studio:       translateDraftEntity(input.Studio),
		Performers:   translateDraftEntitySlice(input.Performers),
		Tags:         translateDraftEntitySlice(input.Tags),
		Fingerprints: fingerprints,
	}

	fac := r.getRepoFactory(ctx)
	err = fac.WithTxn(func() error {
		if input.Image != nil {
			iqb := fac.Image()
			imageService := image.GetService(iqb)
			imageInput := models.ImageCreateInput{
				File: input.Image,
			}
			img, err := imageService.Create(imageInput)
			if err != nil {
				return err
			}
			data.Image = &img.ID
		}

		if err := newDraft.SetData(data); err != nil {
			return err
		}

		_, err := fac.Draft().Create(*newDraft)
		return err
	})

	status := models.DraftSubmissionStatus{}
	if err == nil {
		status.ID = &newDraft.ID
	}

	return &status, err
}

func (r *mutationResolver) SubmitPerformerDraft(ctx context.Context, input models.PerformerDraftInput) (*models.DraftSubmissionStatus, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	currentUser := getCurrentUser(ctx)
	newDraft := models.NewDraft(UUID, currentUser, models.TargetTypeEnumPerformer)

	data := models.PerformerDraft{
		Name:            input.Name,
		Aliases:         input.Aliases,
		Gender:          input.Gender,
		Birthdate:       input.Birthdate,
		Urls:            input.Urls,
		Ethnicity:       input.Ethnicity,
		Country:         input.Country,
		EyeColor:        input.EyeColor,
		HairColor:       input.HairColor,
		Height:          input.Height,
		Measurements:    input.Measurements,
		BreastType:      input.BreastType,
		Tattoos:         input.Tattoos,
		Piercings:       input.Piercings,
		CareerStartYear: input.CareerStartYear,
		CareerEndYear:   input.CareerEndYear,
	}

	fac := r.getRepoFactory(ctx)
	err = fac.WithTxn(func() error {
		if input.Image != nil {
			iqb := fac.Image()
			imageService := image.GetService(iqb)
			imageInput := models.ImageCreateInput{
				File: input.Image,
			}
			img, err := imageService.Create(imageInput)
			if err != nil {
				return err
			}
			data.Image = &img.ID
		}

		if err := newDraft.SetData(data); err != nil {
			return err
		}

		_, err := fac.Draft().Create(*newDraft)
		return err
	})

	status := models.DraftSubmissionStatus{}
	if err == nil {
		status.ID = &newDraft.ID
	}

	return &status, err
}

func (r *mutationResolver) DestroyDraft(ctx context.Context, id uuid.UUID) (bool, error) {
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		return draft.Destroy(fac, id)
	})
	return err == nil, err
}

func translateDraftEntity(entity *models.DraftEntityInput) *models.DraftEntity {
	if entity == nil {
		return nil
	}

	ret := models.DraftEntity{
		Name: entity.Name,
		ID:   entity.ID,
	}

	return &ret
}

func translateDraftEntitySlice(entities []*models.DraftEntityInput) []models.DraftEntity {
	var ret []models.DraftEntity
	for _, entity := range entities {
		ret = append(ret, *translateDraftEntity(entity))
	}

	return ret
}
