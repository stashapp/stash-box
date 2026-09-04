//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type performerRankingTestRunner struct {
	performerImageTypeTestRunner
}

func createPerformerRankingTestRunner(t *testing.T) *performerRankingTestRunner {
	return &performerRankingTestRunner{
		performerImageTypeTestRunner: *createPerformerImageTypeTestRunner(t),
	}
}

func (s *performerRankingTestRunner) orderedImages(performerID uuid.UUID) []uuid.UUID {
	s.t.Helper()

	s.newRequest()
	performer, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(s.t, err)

	images, err := s.resolver.Performer().Images(s.ctx, performer)
	assert.NoError(s.t, err)

	ids := make([]uuid.UUID, len(images))
	for i, image := range images {
		ids[i] = image.ID
	}
	return ids
}

// The worked example from the design, built as a gallery and read back.
func (s *performerRankingTestRunner) testShippedDefaultOrder() {
	// Identical dimensions throughout, so the aspect-ratio tiebreak cannot
	// account for the ordering and only the rank tuple can.
	newImage := func() uuid.UUID {
		image, err := s.createTestImage(400, 600)
		assert.NoError(s.t, err)
		return image.ID
	}

	imageA, imageB, imageC, imageD, imageE := newImage(), newImage(), newImage(), newImage(), newImage()

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{imageA, imageB, imageC, imageD, imageE},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	s.assign(
		// A: portrait, face, front, nude -> (0, 0, 0, 3)
		models.ImageTypeAssignment{ImageID: imageA, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: imageA, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: imageA, Type: models.ImageTypeEnumViewFront},
		models.ImageTypeAssignment{ImageID: imageA, Type: models.ImageTypeEnumDressNude},
		// B: portrait, bust, front, non-nude -> (0, 1, 0, 0)
		models.ImageTypeAssignment{ImageID: imageB, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: imageB, Type: models.ImageTypeEnumCropBust},
		models.ImageTypeAssignment{ImageID: imageB, Type: models.ImageTypeEnumViewFront},
		models.ImageTypeAssignment{ImageID: imageB, Type: models.ImageTypeEnumDressNonNude},
		// C: portrait, face, front, non-nude -> (0, 0, 0, 0), the primary
		models.ImageTypeAssignment{ImageID: imageC, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: imageC, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: imageC, Type: models.ImageTypeEnumViewFront},
		models.ImageTypeAssignment{ImageID: imageC, Type: models.ImageTypeEnumDressNonNude},
		// E: a tattoo close-up -- detail, face -> (2, 0, inf, inf)
		models.ImageTypeAssignment{ImageID: imageE, Type: models.ImageTypeEnumShotDetail},
		models.ImageTypeAssignment{ImageID: imageE, Type: models.ImageTypeEnumCropFace},
		// D is left untyped -> (inf, inf, inf, inf)
	)

	// C first is the ordering doing real work: Shot type outranks Crop, so
	// E's perfectly cropped tattoo close-up cannot take the primary slot
	// from a portrait that is not itself a face crop.
	assert.Equal(s.t, []uuid.UUID{imageC, imageA, imageB, imageE, imageD}, s.orderedImages(performerID))
}

// An admin who wants nude primaries reorders State of dress.
func (s *performerRankingTestRunner) testAdminReorderChangesPrimary() {
	nude, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	clothed, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{nude.ID, clothed.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	// Identical but for state of dress, so that dimension alone decides.
	s.assign(
		models.ImageTypeAssignment{ImageID: nude.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: nude.ID, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: nude.ID, Type: models.ImageTypeEnumDressNude},
		models.ImageTypeAssignment{ImageID: clothed.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: clothed.ID, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: clothed.ID, Type: models.ImageTypeEnumDressNonNude},
	)

	assert.Equal(s.t, clothed.ID, s.orderedImages(performerID)[0], "non-nude leads by default")

	before := s.readGroups()
	defer s.restoreOrder(before)

	// Move DRESS_NUDE ahead of DRESS_NON_NUDE, leaving everything else alone.
	reordered := orderInputFor(before)
	for i, key := range reordered.Types {
		if key == models.ImageTypeEnumDressNonNude {
			reordered.Types = append(reordered.Types[:i], reordered.Types[i+1:]...)
			reordered.Types = append(reordered.Types, models.ImageTypeEnumDressNonNude)
			break
		}
	}

	_, err = s.resolver.Mutation().ImageTypeOrderUpdate(s.ctx, reordered)
	assert.NoError(s.t, err)

	assert.Equal(s.t, nude.ID, s.orderedImages(performerID)[0],
		"reordering State of dress should change the primary image")
}

// The day-one corpus is entirely untyped, and must be unaffected.
func (s *performerRankingTestRunner) testUntypedPerformerUnchanged() {
	wide, err := s.createTestImage(900, 300)
	assert.NoError(s.t, err)
	portrait, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	nearPortrait, err := s.createTestImage(410, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{wide.ID, portrait.ID, nearPortrait.ID},
	})
	assert.NoError(s.t, err)

	// Exactly what the aspect-ratio comparator alone produces: closest to 2:3
	// first, widest last.
	assert.Equal(s.t, []uuid.UUID{portrait.ID, nearPortrait.ID, wide.ID},
		s.orderedImages(performer.UUID()))
}

// Equally ranked images fall back to the comparator rather than to whatever
// order the database returned.
func (s *performerRankingTestRunner) testEqualRanksUseTiebreak() {
	wide, err := s.createTestImage(900, 300)
	assert.NoError(s.t, err)
	portrait, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{wide.ID, portrait.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	s.assign(
		models.ImageTypeAssignment{ImageID: wide.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: portrait.ID, Type: models.ImageTypeEnumShotPortrait},
	)

	assert.Equal(s.t, []uuid.UUID{portrait.ID, wide.ID}, s.orderedImages(performerID),
		"identical tuples should leave the aspect-ratio order intact")
}

func TestShippedDefaultImageOrder(t *testing.T) {
	s := createPerformerRankingTestRunner(t)
	s.testShippedDefaultOrder()
}

func TestAdminReorderChangesPrimary(t *testing.T) {
	s := createPerformerRankingTestRunner(t)
	s.testAdminReorderChangesPrimary()
}

func TestUntypedPerformerUnchanged(t *testing.T) {
	s := createPerformerRankingTestRunner(t)
	s.testUntypedPerformerUnchanged()
}

func TestEqualRanksUseTiebreak(t *testing.T) {
	s := createPerformerRankingTestRunner(t)
	s.testEqualRanksUseTiebreak()
}
