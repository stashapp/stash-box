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

	images, err := s.resolver.Performer().Images(s.ctx, performer)
	assert.NoError(s.t, err)

	byImage := make(map[uuid.UUID]*string, len(images))
	for i := range images {
		byImage[images[i].ID] = images[i].Date
	}
	return byImage
}

func (s *performerImageDateTestRunner) testImageDateFormats() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	update := func(date string) error {
		_, err := s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
			ID:   image.ID,
			Date: &date,
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

func TestImageDateFormats(t *testing.T) {
	s := createPerformerImageDateTestRunner(t)
	s.testImageDateFormats()
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
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:   image.ID,
		Date: &date,
	})
	assert.NoError(s.t, err)
	assert.Equal(s.t, date, *s.datesOf(performerID)[image.ID])

	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:   image.ID,
		Date: nil,
	})
	assert.NoError(s.t, err)
	assert.Nil(s.t, s.datesOf(performerID)[image.ID], "a null date clears it")
}

func TestNullClearsDate(t *testing.T) {
	s := createPerformerImageDateTestRunner(t)
	s.testNullClearsDate()
}

// Equally-labelled images come back most recent first, through the real
// resolver rather than the sort in isolation: what the ordering rule is worth
// depends on the dates reaching it, and that is a dataloader away.
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
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    older.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
		Date:  &oldDate,
	})
	assert.NoError(s.t, err)
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    newer.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
		Date:  &newDate,
	})
	assert.NoError(s.t, err)
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    undated.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
	})
	assert.NoError(s.t, err)

	s.newRequest()
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
