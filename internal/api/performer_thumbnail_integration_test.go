//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type performerThumbnailTestRunner struct {
	performerImageTypeTestRunner
}

func createPerformerThumbnailTestRunner(t *testing.T) *performerThumbnailTestRunner {
	return &performerThumbnailTestRunner{
		performerImageTypeTestRunner: *createPerformerImageTypeTestRunner(t),
	}
}

func (s *performerThumbnailTestRunner) thumbnailFor(viewer *testRunner, performerID uuid.UUID) *models.Image {
	s.t.Helper()

	viewer.newRequest()
	performer, err := viewer.resolver.Query().FindPerformer(viewer.ctx, performerID)
	assert.NoError(s.t, err)

	thumbnail, err := viewer.resolver.Performer().Thumbnail(viewer.ctx, performer)
	assert.NoError(s.t, err)
	return thumbnail
}

// The regression test for the prepended-boost mistake. A face-tattoo close-up
// must not beat a portrait that is not itself a face crop: Shot type outranks
// Crop, and overriding the Crop component leaves that intact where prepending
// a boost would not.
func (s *performerThumbnailTestRunner) testDetailFaceLosesToPortrait() {
	tattoo, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	portrait, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{tattoo.ID, portrait.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	s.assign(performerID,
		// A close-up of a face tattoo: a face crop, but not a photograph of
		// the person.
		models.ImageTypeAssignment{ImageID: tattoo.ID, Type: models.ImageTypeEnumShotDetail},
		models.ImageTypeAssignment{ImageID: tattoo.ID, Type: models.ImageTypeEnumCropFace},
		// A portrait, cropped less tightly.
		models.ImageTypeAssignment{ImageID: portrait.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: portrait.ID, Type: models.ImageTypeEnumCropBust},
	)

	thumbnail := s.thumbnailFor(asRead(s.t), performerID)
	if assert.NotNil(s.t, thumbnail) {
		assert.Equal(s.t, portrait.ID, thumbnail.ID,
			"a SHOT_DETAIL face crop must not outrank a SHOT_PORTRAIT image")
	}
}

// Among photographs of the person, the face crop wins -- and keeps winning
// when the viewer's preference ranks it last.
func (s *performerThumbnailTestRunner) testFacePreferredDespiteViewerPreference() {
	face, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	body, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{face.ID, body.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	s.assign(performerID,
		models.ImageTypeAssignment{ImageID: face.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: face.ID, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: body.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: body.ID, Type: models.ImageTypeEnumCropFullBody},
	)

	viewer := asEdit(s.t)
	assert.Equal(s.t, face.ID, s.thumbnailFor(viewer, performerID).ID)

	// The viewer prefers full body and ranks the face crop last. Their gallery
	// changes; their thumbnails do not.
	_, err = viewer.resolver.Mutation().UpdateImageTypePreferences(viewer.ctx, models.ImageTypePreferencesInput{Types: []models.ImageTypeEnum{
		models.ImageTypeEnumCropFullBody,
		models.ImageTypeEnumCropTorso,
		models.ImageTypeEnumCropWide,
		models.ImageTypeEnumCropThreeQuarter,
		models.ImageTypeEnumCropThreeQuarterPlus,
		models.ImageTypeEnumCropBust,
		models.ImageTypeEnumCropFace,
	}})
	assert.NoError(s.t, err)
	defer func() {
		_, _ = viewer.resolver.Mutation().UpdateImageTypePreferences(viewer.ctx, clearPreferences())
	}()

	viewer.newRequest()
	performerForViewer, err := viewer.resolver.Query().FindPerformer(viewer.ctx, performerID)
	assert.NoError(s.t, err)
	images, err := viewer.resolver.Performer().Images(viewer.ctx, performerForViewer)
	assert.NoError(s.t, err)
	assert.Equal(s.t, body.ID, images[0].ID, "the gallery should follow the preference")

	assert.Equal(s.t, face.ID, s.thumbnailFor(viewer, performerID).ID,
		"the thumbnail must ignore the viewer's preference")
}

// With no face crop anywhere, this is just the instance ordering's first
// image -- today's behaviour.
func (s *performerThumbnailTestRunner) testFallsBackToInstanceOrdering() {
	bust, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	wide, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{wide.ID, bust.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	s.assign(performerID,
		models.ImageTypeAssignment{ImageID: bust.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: bust.ID, Type: models.ImageTypeEnumCropBust},
		models.ImageTypeAssignment{ImageID: wide.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: wide.ID, Type: models.ImageTypeEnumCropWide},
	)

	viewer := asRead(s.t)
	assert.Equal(s.t, bust.ID, s.thumbnailFor(viewer, performerID).ID)

	// And with nothing labelled at all, the aspect-ratio comparator decides.
	untypedPortrait, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	untypedWide, err := s.createTestImage(900, 300)
	assert.NoError(s.t, err)

	untyped, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{untypedWide.ID, untypedPortrait.ID},
	})
	assert.NoError(s.t, err)

	assert.Equal(s.t, untypedPortrait.ID, s.thumbnailFor(viewer, untyped.UUID()).ID)
}

// Viewer-independence has to be checked outside the Crop dimension. The
// override replaces the Crop component wholesale, so a preference within Crop
// cannot show whether the thumbnail used the viewer's ordering or the
// instance's -- only the other groups can.
func (s *performerThumbnailTestRunner) testThumbnailIgnoresPreferenceInOtherGroups() {
	clothed, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	nude, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{clothed.ID, nude.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	// Both are face crops, so the override ties that component and State of
	// dress decides.
	s.assign(performerID,
		models.ImageTypeAssignment{ImageID: clothed.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: clothed.ID, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: clothed.ID, Type: models.ImageTypeEnumDressNonNude},
		models.ImageTypeAssignment{ImageID: nude.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: nude.ID, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: nude.ID, Type: models.ImageTypeEnumDressNude},
	)

	viewer := asEdit(s.t)
	assert.Equal(s.t, clothed.ID, s.thumbnailFor(viewer, performerID).ID)

	_, err = viewer.resolver.Mutation().UpdateImageTypePreferences(viewer.ctx, models.ImageTypePreferencesInput{Types: []models.ImageTypeEnum{
		models.ImageTypeEnumDressNude,
	}})
	assert.NoError(s.t, err)
	defer func() {
		_, _ = viewer.resolver.Mutation().UpdateImageTypePreferences(viewer.ctx, clearPreferences())
	}()

	viewer.newRequest()
	performerForViewer, err := viewer.resolver.Query().FindPerformer(viewer.ctx, performerID)
	assert.NoError(s.t, err)
	images, err := viewer.resolver.Performer().Images(viewer.ctx, performerForViewer)
	assert.NoError(s.t, err)
	assert.Equal(s.t, nude.ID, images[0].ID, "the gallery should follow the preference")

	assert.Equal(s.t, clothed.ID, s.thumbnailFor(viewer, performerID).ID,
		"the thumbnail must rank against the instance ordering, not the viewer's")
}

func (s *performerThumbnailTestRunner) testNoImagesIsNull() {
	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: s.generatePerformerName(),
	})
	assert.NoError(s.t, err)

	assert.Nil(s.t, s.thumbnailFor(asRead(s.t), performer.UUID()))
}

func TestThumbnailDetailFaceLosesToPortrait(t *testing.T) {
	s := createPerformerThumbnailTestRunner(t)
	s.testDetailFaceLosesToPortrait()
}

func TestThumbnailFacePreferredDespiteViewerPreference(t *testing.T) {
	s := createPerformerThumbnailTestRunner(t)
	s.testFacePreferredDespiteViewerPreference()
}

func TestThumbnailFallsBackToInstanceOrdering(t *testing.T) {
	s := createPerformerThumbnailTestRunner(t)
	s.testFallsBackToInstanceOrdering()
}

func TestThumbnailIgnoresPreferenceInOtherGroups(t *testing.T) {
	s := createPerformerThumbnailTestRunner(t)
	s.testThumbnailIgnoresPreferenceInOtherGroups()
}

func TestThumbnailNoImagesIsNull(t *testing.T) {
	s := createPerformerThumbnailTestRunner(t)
	s.testNoImagesIsNull()
}
