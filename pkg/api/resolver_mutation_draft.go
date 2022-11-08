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

	fingerprints := filterFingerprints(input.Fingerprints)

	data := models.SceneDraft{
		ID:           input.ID,
		Title:        input.Title,
		Code:         input.Code,
		Details:      input.Details,
		Director:     input.Director,
		URL:          input.URL,
		Date:         input.Date,
		Studio:       translateDraftEntity(input.Studio),
		Performers:   translateDraftEntitySlice(input.Performers),
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

		if len(input.Tags) > 0 {
			tags, err := resolveTags(input.Tags, fac)
			if err != nil {
				return err
			}
			data.Tags = tags
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
		ID:              input.ID,
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

func filterFingerprints(input []*models.FingerprintInput) []models.DraftFingerprint {
	resultMap := make(map[string]bool)
	var fingerprints []models.DraftFingerprint

	for _, fp := range input {
		unique := fp.Hash + fp.Algorithm.String()
		if _, exists := resultMap[unique]; !exists {
			fingerprints = append(fingerprints, models.DraftFingerprint{
				Hash:      fp.Hash,
				Algorithm: fp.Algorithm,
				Duration:  fp.Duration,
			})
			resultMap[unique] = true
		}
	}

	return fingerprints
}

func resolveTags(tags []*models.DraftEntityInput, fac models.Repo) ([]models.DraftEntity, error) {
	tqb := fac.Tag()

	var results []models.DraftEntity
	resultMap := make(map[string]bool)
	for _, tag := range tags {
		foundTag, err := tqb.FindByNameOrAlias(tag.Name)
		if err != nil {
			return nil, err
		}

		res := models.DraftEntity{
			Name: tag.Name,
		}
		if foundTag != nil {
			res.Name = foundTag.Name
			res.ID = &foundTag.ID
		}
		if _, exists := resultMap[res.Name]; !exists {
			resultMap[res.Name] = true
			results = append(results, res)
		}
	}

	return results, nil
}
