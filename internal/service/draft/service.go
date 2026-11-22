package draft

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
	"github.com/stashapp/stash-box/pkg/utils"
)

type Draft struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

func NewDraft(queries *queries.Queries, withTxn queries.WithTxnFunc) *Draft {
	return &Draft{
		queries: queries,
		withTxn: withTxn,
	}
}

// FindPerformers takes a slice of DraftEntity performers and returns SceneDraftPerformer models
// by using FindPerformersWithRedirects to resolve existing performers or keep as DraftEntity
func (s *Draft) FindPerformers(ctx context.Context, draftPerformers []models.DraftEntity) ([]models.SceneDraftPerformer, error) {
	var result []models.SceneDraftPerformer
	for _, p := range draftPerformers {
		if p.ID != nil {
			dbPerformers, err := s.queries.FindPerformerWithRedirect(ctx, *p.ID)
			if err != nil {
				return nil, err
			}

			if len(dbPerformers) > 0 {
				result = append(result, converter.PerformerToModel(dbPerformers[0]))
				continue
			}
		}
		result = append(result, p)
	}

	return result, nil
}

// FindTags takes a slice of DraftEntity tags and returns SceneDraftTag models
// by using FindTagsWithRedirects to resolve existing tags or keep as DraftEntity
func (s *Draft) FindTags(ctx context.Context, draftTags []models.DraftEntity) ([]models.SceneDraftTag, error) {
	var result []models.SceneDraftTag
	for _, t := range draftTags {
		if t.ID != nil {
			dbTags, err := s.queries.FindTagWithRedirect(ctx, *t.ID)
			if err != nil {
				return nil, err
			}

			if len(dbTags) > 0 {
				result = append(result, converter.TagToModel(dbTags[0]))
				continue
			}
		}
		result = append(result, t)
	}

	return result, nil
}

func (s *Draft) FindGalleryTags(ctx context.Context, entities []models.DraftEntity) ([]models.GalleryDraftTag, error) {
	tags, err := s.FindTags(ctx, entities)
	if err != nil {
		return nil, err
	}
	result := make([]models.GalleryDraftTag, len(tags))
	for i := range tags {
		switch value := tags[i].(type) {
		case models.Tag:
			result[i] = value
		case models.DraftEntity:
			result[i] = value
		}
	}
	return result, nil
}

func (s *Draft) FindGalleryImageTags(ctx context.Context, entities []models.DraftEntity) ([]models.GalleryDraftImageTag, error) {
	tags, err := s.FindTags(ctx, entities)
	if err != nil {
		return nil, err
	}
	result := make([]models.GalleryDraftImageTag, len(tags))
	for i := range tags {
		switch value := tags[i].(type) {
		case models.Tag:
			result[i] = value
		case models.DraftEntity:
			result[i] = value
		}
	}
	return result, nil
}

// FindStudio takes a DraftEntity studio and returns SceneDraftStudio model
// by using FindStudioWithRedirect to resolve existing studio or keep as DraftEntity
func (s *Draft) FindStudio(ctx context.Context, draftStudio *models.DraftEntity) (models.SceneDraftStudio, error) {
	if draftStudio == nil {
		return nil, nil
	}

	// If the draft studio has an ID, try to find the actual studio
	if draftStudio.ID != nil {
		studio, err := s.queries.FindStudioWithRedirect(ctx, *draftStudio.ID)
		if err != nil {
			return nil, err
		}

		// Return the converted studio
		convertedStudio := converter.StudioToModel(studio)
		return convertedStudio, nil
	}

	// If no ID, return the draft entity
	return *draftStudio, nil
}

func (s *Draft) FindGalleryStudio(ctx context.Context, entity *models.DraftEntity) (models.GalleryDraftStudio, error) {
	resolved, err := s.FindStudio(ctx, entity)
	if err != nil {
		return nil, err
	}
	switch value := resolved.(type) {
	case models.Studio:
		return value, nil
	case models.DraftEntity:
		return value, nil
	default:
		return nil, nil
	}
}

func (s *Draft) FindGalleryPerformers(ctx context.Context, entities []models.DraftEntity) ([]models.GalleryDraftPerformer, error) {
	performers, err := s.FindPerformers(ctx, entities)
	if err != nil {
		return nil, err
	}
	result := make([]models.GalleryDraftPerformer, len(performers))
	for i := range performers {
		switch value := performers[i].(type) {
		case models.Performer:
			result[i] = value
		case models.DraftEntity:
			result[i] = value
		}
	}
	return result, nil
}

func (s *Draft) FindGalleryScenes(ctx context.Context, entities []models.DraftEntity) ([]models.GalleryDraftScene, error) {
	result := make([]models.GalleryDraftScene, 0, len(entities))
	for _, entity := range entities {
		if entity.ID != nil {
			scene, err := s.queries.FindScene(ctx, *entity.ID)
			if err == nil {
				result = append(result, converter.SceneToModel(scene))
				continue
			}
		}
		result = append(result, entity)
	}
	return result, nil
}

func (s *Draft) SubmitScene(ctx context.Context, input models.SceneDraftInput, imageID *uuid.UUID) (*models.DraftSubmissionStatus, error) {
	UUID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	user := auth.GetCurrentUser(ctx)
	newDraft := queries.CreateDraftParams{
		ID:     UUID,
		UserID: user.ID,
		Type:   models.TargetTypeEnumScene.String(),
	}

	data := converter.SceneDraftInputToSceneDraft(input)
	data.Image = imageID

	err = s.withTxn(func(tx *queries.Queries) error {
		if len(input.Tags) > 0 {
			tags, err := s.resolveTags(ctx, input.Tags)
			if err != nil {
				return err
			}
			data.Tags = tags
		}

		// Temporary code, while we deprecate the URL parameter.
		if input.URL != nil {
			data.URLs = []string{*input.URL}
		}

		json, err := utils.ToJSON(data)
		if err != nil {
			return err
		}
		newDraft.Data = json

		_, err = tx.CreateDraft(ctx, newDraft)
		return err
	})

	status := models.DraftSubmissionStatus{}
	if err == nil {
		status.ID = &newDraft.ID
	}

	return &status, err
}

func (s *Draft) SubmitPerformer(ctx context.Context, input models.PerformerDraftInput, imageID *uuid.UUID) (*models.DraftSubmissionStatus, error) {
	UUID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	user := auth.GetCurrentUser(ctx)
	newDraft := queries.CreateDraftParams{
		ID:     UUID,
		UserID: user.ID,
		Type:   models.TargetTypeEnumPerformer.String(),
	}

	data := models.PerformerDraft{
		ID:              input.ID,
		Name:            input.Name,
		Disambiguation:  input.Disambiguation,
		Aliases:         input.Aliases,
		Gender:          input.Gender,
		Birthdate:       input.Birthdate,
		Deathdate:       input.Deathdate,
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
		Image:           imageID,
	}

	err = s.withTxn(func(tx *queries.Queries) error {
		json, err := utils.ToJSON(data)
		if err != nil {
			return err
		}
		newDraft.Data = json

		_, err = tx.CreateDraft(ctx, newDraft)
		return err
	})

	status := models.DraftSubmissionStatus{}
	if err == nil {
		status.ID = &newDraft.ID
	}

	return &status, err
}

func (s *Draft) SubmitGallery(ctx context.Context, input models.GalleryDraftInput, coverID *uuid.UUID) (*models.DraftSubmissionStatus, error) {
	if err := models.ValidateGalleryImages(
		input.Images,
		func(image models.GalleryDraftImageInput) int { return image.Index },
		func(image models.GalleryDraftImageInput) models.FingerprintHash { return image.Phash },
	); err != nil {
		return nil, err
	}
	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}
	user := auth.GetCurrentUser(ctx)
	data := models.GalleryDraft{
		ID: input.ID, Title: input.Title, Code: input.Code, Date: input.Date,
		Photographer: input.Photographer, Details: input.Details, URLs: input.Urls,
		Cover: coverID,
	}
	if input.Studio != nil {
		data.Studio = draftEntity(*input.Studio)
	}
	data.Performers = draftEntities(input.Performers)
	data.Scenes = draftEntities(input.Scenes)
	tags, err := s.resolveTags(ctx, input.Tags)
	if err != nil {
		return nil, err
	}
	data.Tags = tags
	data.Images = make([]models.DraftGalleryImage, len(input.Images))
	for i, image := range input.Images {
		imageTags, err := s.resolveTags(ctx, image.Tags)
		if err != nil {
			return nil, err
		}
		data.Images[i] = models.DraftGalleryImage{
			Index: image.Index, PHash: image.Phash, Tags: imageTags,
		}
	}
	payload, err := utils.ToJSON(data)
	if err != nil {
		return nil, err
	}
	_, err = s.queries.CreateDraft(ctx, queries.CreateDraftParams{
		ID: id, UserID: user.ID, Type: models.TargetTypeEnumGallery.String(), Data: payload,
	})
	status := models.DraftSubmissionStatus{}
	if err == nil {
		status.ID = &id
	}
	return &status, err
}

func draftEntity(input models.DraftEntityInput) *models.DraftEntity {
	return &models.DraftEntity{Name: input.Name, ID: input.ID}
}

func draftEntities(input []models.DraftEntityInput) []models.DraftEntity {
	result := make([]models.DraftEntity, len(input))
	for i := range input {
		result[i] = *draftEntity(input[i])
	}
	return result
}

func (s *Draft) Destroy(ctx context.Context, user *auth.AuthUser, id uuid.UUID) (bool, error) {
	draft, err := s.queries.FindDraft(ctx, id)
	if err != nil {
		return false, err
	}

	if user == nil || draft.UserID != user.ID {
		return false, fmt.Errorf("unauthorized")
	}

	err = s.queries.DeleteDraft(ctx, id)
	return err == nil, err
}

func (s *Draft) resolveTags(ctx context.Context, tags []models.DraftEntityInput) ([]models.DraftEntity, error) {
	var results []models.DraftEntity
	resultMap := make(map[string]bool)

	for _, tag := range tags {
		res := models.DraftEntity{}

		if tag.ID != nil {
			dbTag, err := s.queries.FindTag(ctx, *tag.ID)
			if err == nil && dbTag.ID == *tag.ID {
				res.Name = dbTag.Name
				res.ID = &dbTag.ID
			}
		} else {
			foundTag, err := s.queries.FindTagByNameOrAlias(ctx, tag.Name)
			if err == nil {
				res.Name = foundTag.Name
				res.ID = &foundTag.ID
			}
		}

		if res.Name == "" {
			res = models.DraftEntity{
				Name: tag.Name,
			}
		}

		if _, exists := resultMap[res.Name]; !exists {
			resultMap[res.Name] = true
			results = append(results, res)
		}
	}

	return results, nil
}

func (s *Draft) FindByUser(ctx context.Context, userID uuid.UUID) ([]models.Draft, error) {
	dbDrafts, err := s.queries.FindDraftsByUser(ctx, userID)
	var drafts []models.Draft
	for _, draft := range dbDrafts {
		drafts = append(drafts, converter.DraftToModel(draft))
	}

	return drafts, err
}

func (s *Draft) FindByID(ctx context.Context, draftID uuid.UUID) (*models.Draft, error) {
	draft, err := s.queries.FindDraft(ctx, draftID)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}

	return converter.DraftToModelPtr(draft), nil
}

func (s *Draft) DeleteExpired(ctx context.Context) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return tx.DeleteExpiredDrafts(ctx, config.GetDraftTimeLimit())
	})
}
