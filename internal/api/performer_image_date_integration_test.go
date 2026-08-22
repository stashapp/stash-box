//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type performerImageDateTestRunner struct {
	performerImageTypeTestRunner
}

func createPerformerImageDateTestRunner(t *testing.T) *performerImageDateTestRunner {
	return &performerImageDateTestRunner{
		performerImageTypeTestRunner: *createPerformerImageTypeTestRunner(t),
	}
}

func (s *performerImageDateTestRunner) datesOf(performerID uuid.UUID) map[uuid.UUID]*string {
	s.t.Helper()

	s.newRequest()
	performer, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(s.t, err)

	typedImages, err := s.resolver.Performer().TypedImages(s.ctx, performer)
	assert.NoError(s.t, err)

	byImage := make(map[uuid.UUID]*string, len(typedImages))
	for _, typedImage := range typedImages {
		byImage[typedImage.Image.ID] = typedImage.Date
	}
	return byImage
}

func (s *performerImageDateTestRunner) testTakenDateFormats() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	ctx := s.updateContext([]string{"image_ids", "image_types"})
	update := func(date string) error {
		_, err := s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
			ID:       performerID,
			ImageIds: []uuid.UUID{image.ID},
			ImageTypes: []models.ImageAssignmentInput{
				{ImageID: image.ID, Types: []models.ImageTypeEnum{}, Date: &date},
			},
		})
		return err
	}

	for _, accepted := range []string{"2019", "2019-06", "2019-06-15"} {
		assert.NoError(s.t, update(accepted), "%s should be accepted", accepted)
		assert.Equal(s.t, accepted, *s.datesOf(performerID)[image.ID])
	}

	// The column is text, so nothing downstream would catch these.
	for _, rejected := range []string{"19-6-1", "2019-13", "2019-06-32", "2019-1", "sometime in 2019", "2019/06/15", ""} {
		assert.ErrorContains(s.t, update(rejected), "invalid date", "%q should be rejected", rejected)
	}

	// Still the last accepted value: a rejected update changes nothing.
	assert.Equal(s.t, "2019-06-15", *s.datesOf(performerID)[image.ID])
}

// A date needs no labels to go with it, and needs no image change either.
func (s *performerImageDateTestRunner) testDateOnlyEditOnUnlabelledImage() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	date := "2021-03"
	edit, err := s.createTestPerformerEdit(
		models.OperationEnumModify,
		&models.PerformerEditDetailsInput{
			ImageIds: []uuid.UUID{image.ID},
			ImageTypes: []models.ImageAssignmentInput{
				{ImageID: image.ID, Types: []models.ImageTypeEnum{}, Date: &date},
			},
		},
		&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		nil,
	)
	assert.NoError(s.t, err)

	_, err = s.approveEdit(edit.ID)
	assert.NoError(s.t, err)

	assert.Equal(s.t, date, *s.datesOf(performerID)[image.ID])
	assert.Empty(s.t, s.typesOf(performerID)[image.ID], "the image is dated but still unlabelled")
}

// The regression this design came closest to shipping. updateImagesFromEdit
// truncates performer_images, and date is a column on those rows, so a
// missing resolve query drops every date whenever an unrelated field changes.
func (s *performerImageDateTestRunner) testDatesSurviveNameOnlyEdit() {
	var images []uuid.UUID
	for range 3 {
		image, err := s.createTestImage(400, 600)
		assert.NoError(s.t, err)
		images = append(images, image.ID)
	}

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: images,
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	dates := []string{"2019", "2020-06", "2021-03-04"}
	assignments := make([]models.ImageAssignmentInput, len(images))
	for i, imageID := range images {
		assignments[i] = models.ImageAssignmentInput{
			ImageID: imageID,
			Types:   []models.ImageTypeEnum{},
			Date:    &dates[i],
		}
	}

	ctx := s.updateContext([]string{"image_ids", "image_types"})
	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:         performerID,
		ImageIds:   images,
		ImageTypes: assignments,
	})
	assert.NoError(s.t, err)

	assertDates := func(context string) {
		after := s.datesOf(performerID)
		for i, imageID := range images {
			if assert.NotNil(s.t, after[imageID], "%s: image %d lost its date", context, i) {
				assert.Equal(s.t, dates[i], *after[imageID], context)
			}
		}
	}
	assertDates("after dating")

	// An edit that never mentions images.
	newName := s.generatePerformerName()
	edit, err := s.createTestPerformerEdit(
		models.OperationEnumModify,
		&models.PerformerEditDetailsInput{Name: &newName},
		&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		nil,
	)
	assert.NoError(s.t, err)

	_, err = s.approveEdit(edit.ID)
	assert.NoError(s.t, err)
	assertDates("after a name-only edit")

	// And the direct path, which rebuilds the same rows.
	imageOnlyCtx := s.updateContext([]string{"image_ids"})
	_, err = s.resolver.Mutation().PerformerUpdate(imageOnlyCtx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: images,
	})
	assert.NoError(s.t, err)
	assertDates("after a performerUpdate omitting image_types")
}

func (s *performerImageDateTestRunner) testConcurrentDatingMerges() {
	first, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	second, err := s.createTestImage(600, 400)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{first.ID, second.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	bothImages := []uuid.UUID{first.ID, second.ID}
	firstDate := "2018"
	secondDate := "2022-09"

	dateEdit := func(imageID uuid.UUID, date *string) *models.Edit {
		edit, err := s.createTestPerformerEdit(
			models.OperationEnumModify,
			&models.PerformerEditDetailsInput{
				ImageIds: bothImages,
				ImageTypes: []models.ImageAssignmentInput{
					{ImageID: imageID, Types: []models.ImageTypeEnum{}, Date: date},
				},
			},
			&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
			nil,
		)
		assert.NoError(s.t, err)
		return edit
	}

	editA := dateEdit(first.ID, &firstDate)
	editB := dateEdit(second.ID, &secondDate)

	_, err = s.approveEdit(editA.ID)
	assert.NoError(s.t, err)
	_, err = s.approveEdit(editB.ID)
	assert.NoError(s.t, err)

	after := s.datesOf(performerID)
	if assert.NotNil(s.t, after[first.ID], "the second edit should keep the first's date") {
		assert.Equal(s.t, firstDate, *after[first.ID])
	}
	if assert.NotNil(s.t, after[second.ID]) {
		assert.Equal(s.t, secondDate, *after[second.ID])
	}
}

// An entry overrides rather than merges, so a null clears the date.
func (s *performerImageDateTestRunner) testNullClearsDate() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	date := "2017-08"
	ctx := s.updateContext([]string{"image_ids", "image_types"})
	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: []uuid.UUID{image.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: image.ID, Types: []models.ImageTypeEnum{}, Date: &date},
		},
	})
	assert.NoError(s.t, err)
	assert.Equal(s.t, date, *s.datesOf(performerID)[image.ID])

	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: []uuid.UUID{image.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: image.ID, Types: []models.ImageTypeEnum{}, Date: nil},
		},
	})
	assert.NoError(s.t, err)
	assert.Nil(s.t, s.datesOf(performerID)[image.ID], "a null date clears it")
}

func TestTakenDateFormats(t *testing.T) {
	s := createPerformerImageDateTestRunner(t)
	s.testTakenDateFormats()
}

func TestDateOnlyEditOnUnlabelledImage(t *testing.T) {
	s := createPerformerImageDateTestRunner(t)
	s.testDateOnlyEditOnUnlabelledImage()
}

func TestDatesSurviveNameOnlyEdit(t *testing.T) {
	s := createPerformerImageDateTestRunner(t)
	s.testDatesSurviveNameOnlyEdit()
}

func TestConcurrentDatingMerges(t *testing.T) {
	s := createPerformerImageDateTestRunner(t)
	s.testConcurrentDatingMerges()
}

func TestNullClearsDate(t *testing.T) {
	s := createPerformerImageDateTestRunner(t)
	s.testNullClearsDate()
}

// Equally-labelled images come back most recent first, through the real
// resolver rather than the sort in isolation: what the ordering rule is worth
// depends on the dates reaching it, and that is three dataloaders away.
func (s *performerImageDateTestRunner) testGalleryOrdersTiesByDateNewestFirst() {
	older, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	newer, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	undated, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{older.ID, newer.ID, undated.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	// The same label on all three, so nothing but the date can separate them.
	oldDate, newDate := "2019-06", "2023"
	_, err = s.resolver.Mutation().PerformerUpdate(s.ctx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: []uuid.UUID{older.ID, newer.ID, undated.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: older.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait}, Date: &oldDate},
			{ImageID: newer.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait}, Date: &newDate},
			{ImageID: undated.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait}},
		},
	})
	assert.NoError(s.t, err)

	images, err := s.resolver.Performer().Images(s.ctx, &models.Performer{ID: performerID})
	assert.NoError(s.t, err)

	if assert.Len(s.t, images, 3) {
		assert.Equal(s.t, newer.ID, images[0].ID, "the most recent goes first")
		assert.Equal(s.t, older.ID, images[1].ID)
		assert.Equal(s.t, undated.ID, images[2].ID,
			"an undated image goes last: no date is not a claim to be old")
	}
}

func TestGalleryOrdersTiesByDateNewestFirst(t *testing.T) {
	s := createPerformerImageDateTestRunner(t)
	s.testGalleryOrdersTiesByDateNewestFirst()
}
