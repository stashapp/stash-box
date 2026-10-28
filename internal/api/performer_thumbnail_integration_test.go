//go:build integration

package api_test

import (
	"errors"
	"slices"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/service/imagetype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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

// A face-tattoo close-up must not beat a portrait that is not itself a face
// crop: Shot type outranks Crop, so the face preference has to override the
// Crop component rather than being prepended above the whole tuple, which
// would put it above Shot type too
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

	s.assign(
		// A close-up of a face tattoo: a face crop, but not a photograph of the person
		models.ImageTypeAssignment{ImageID: tattoo.ID, Type: models.ImageTypeEnumShotDetail},
		models.ImageTypeAssignment{ImageID: tattoo.ID, Type: models.ImageTypeEnumCropFace},
		// A portrait, cropped less tightly
		models.ImageTypeAssignment{ImageID: portrait.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: portrait.ID, Type: models.ImageTypeEnumCropBust},
	)

	thumbnail := s.thumbnailFor(asRead(s.t), performerID)
	if assert.NotNil(s.t, thumbnail) {
		assert.Equal(s.t, portrait.ID, thumbnail.ID,
			"a SHOT_DETAIL face crop must not outrank a SHOT_PORTRAIT image")
	}
}

// Among photographs of the person, the face crop wins and keeps winning even when the viewer's preference ranks it last
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

	s.assign(
		models.ImageTypeAssignment{ImageID: face.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: face.ID, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: body.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: body.ID, Type: models.ImageTypeEnumCropFullBody},
	)

	viewer := asEdit(s.t)
	assert.Equal(s.t, face.ID, s.thumbnailFor(viewer, performerID).ID)

	// The viewer prefers full body and ranks the face crop last: their gallery changes but their thumbnails do not
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

// With no face crop anywhere, this is just the instance ordering's first image
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

	s.assign(
		models.ImageTypeAssignment{ImageID: bust.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: bust.ID, Type: models.ImageTypeEnumCropBust},
		models.ImageTypeAssignment{ImageID: wide.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: wide.ID, Type: models.ImageTypeEnumCropWide},
	)

	viewer := asRead(s.t)
	assert.Equal(s.t, bust.ID, s.thumbnailFor(viewer, performerID).ID)

	// And with nothing labelled at all, the aspect-ratio comparator decides
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

// Viewer-independence has to be checked outside the Crop dimension
//
// The override replaces the Crop component wholesale, so a preference within Crop
// cannot show whether the thumbnail used the viewer's ordering or the instance's: only the other groups can
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

	// Both are face crops, so the override ties that component and State of dress decides
	s.assign(
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

func TestThumbnailFacePreferenceSurvivesInstanceReorder(t *testing.T) {
	s := createPerformerThumbnailTestRunner(t)
	admin := asAdmin(t)
	before := admin.readGroups()
	t.Cleanup(func() { admin.restoreOrder(before) })

	order := orderInputFor(before)
	faceIndex := slices.Index(order.Types, models.ImageTypeEnumCropFace)
	bodyIndex := slices.Index(order.Types, models.ImageTypeEnumCropFullBody)
	order.Types[faceIndex], order.Types[bodyIndex] = order.Types[bodyIndex], order.Types[faceIndex]
	_, err := admin.resolver.Mutation().ImageTypeOrderUpdate(admin.ctx, order)
	assert.NoError(t, err)

	face, err := s.createTestImage(400, 600)
	assert.NoError(t, err)
	body, err := s.createTestImage(400, 600)
	assert.NoError(t, err)
	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{body.ID, face.ID},
	})
	assert.NoError(t, err)
	s.assign(
		models.ImageTypeAssignment{ImageID: face.ID, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: body.ID, Type: models.ImageTypeEnumCropFullBody},
	)

	viewer := asRead(t)
	viewer.newRequest()
	images, err := viewer.resolver.Performer().Images(viewer.ctx, &models.Performer{ID: performer.UUID()})
	assert.NoError(t, err)
	if assert.Len(t, images, 2) {
		assert.Equal(t, body.ID, images[0].ID, "gallery follows the reordered site preference")
	}
	thumbnail := s.thumbnailFor(viewer, performer.UUID())
	if assert.NotNil(t, thumbnail) {
		assert.Equal(t, face.ID, thumbnail.ID, "face crop boost overrides the site's crop order")
	}
}

func TestThumbnailTiebreaksMatchImageOrdering(t *testing.T) {
	for _, testCase := range []struct {
		name       string
		organized  bool
		date       string
		otherDate  string
		width      int
		otherWidth int
	}{
		{name: "organized before newer date and shape", organized: true, date: "2019", otherDate: "2024", width: 410, otherWidth: 400},
		{name: "newer date before shape", date: "2024", otherDate: "2019", width: 900, otherWidth: 400},
		{name: "portrait shape breaks remaining ties", width: 400, otherWidth: 900},
	} {
		t.Run(testCase.name, func(t *testing.T) {
			s := createPerformerThumbnailTestRunner(t)
			preferred, err := s.createTestImage(testCase.width, 600)
			require.NoError(t, err)
			other, err := s.createTestImage(testCase.otherWidth, 600)
			require.NoError(t, err)
			performer, err := s.createTestPerformer(&models.PerformerCreateInput{
				Name:     s.generatePerformerName(),
				ImageIds: []uuid.UUID{other.ID, preferred.ID},
			})
			require.NoError(t, err)

			for _, entry := range []struct {
				id   uuid.UUID
				date string
			}{
				{id: preferred.ID, date: testCase.date},
				{id: other.ID, date: testCase.otherDate},
			} {
				if entry.date != "" {
					_, err := s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{ID: entry.id, Date: &entry.date})
					require.NoError(t, err)
				}
			}
			if testCase.organized {
				_, err := s.resolver.Mutation().ImageSetOrganized(s.ctx, models.ImageSetOrganizedInput{ID: preferred.ID, Organized: true})
				require.NoError(t, err)
			}

			viewer := asRead(t)
			thumbnail := s.thumbnailFor(viewer, performer.UUID())
			require.NotNil(t, thumbnail)
			assert.Equal(t, preferred.ID, thumbnail.ID)
			images, err := viewer.resolver.Performer().Images(viewer.ctx, &models.Performer{ID: performer.UUID()})
			require.NoError(t, err)
			require.Len(t, images, 2)
			assert.Equal(t, preferred.ID, images[0].ID)
		})
	}
}

func TestSinglePerformerImageSkipsRanking(t *testing.T) {
	s := asAdmin(t)
	img, err := s.createTestImage(400, 600, models.ImageTypeEnumCropFace)
	require.NoError(t, err)
	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: s.generatePerformerName(), ImageIds: []uuid.UUID{img.ID},
	})
	require.NoError(t, err)
	s.newRequest()
	unexpected := errors.New("a single image needs no ranking lookups")
	loaders := dataloader.For(s.ctx)
	loaders.ImageTypesByID = *dataloader.NewImageTypeAssignmentsLoader(dataloader.ImageTypeAssignmentsLoaderConfig{
		Fetch: func([]uuid.UUID) ([][]models.ImageTypeAssignment, []error) {
			return nil, []error{unexpected}
		},
	})
	loaders.UserImageTypeVocabulary = func() (*imagetype.Vocabulary, error) {
		return nil, unexpected
	}

	model := &models.Performer{ID: performer.UUID()}
	images, err := s.resolver.Performer().Images(s.ctx, model)
	require.NoError(t, err)
	require.Len(t, images, 1)
	assert.Equal(t, img.ID, images[0].ID)
	thumbnail, err := s.resolver.Performer().Thumbnail(s.ctx, model)
	require.NoError(t, err)
	require.NotNil(t, thumbnail)
	assert.Equal(t, img.ID, thumbnail.ID)
}
