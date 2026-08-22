//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type imageTypePreferenceTestRunner struct {
	performerImageTypeTestRunner
}

func createImageTypePreferenceTestRunner(t *testing.T) *imageTypePreferenceTestRunner {
	return &imageTypePreferenceTestRunner{
		performerImageTypeTestRunner: *createPerformerImageTypeTestRunner(t),
	}
}

// orderedFor reads the gallery as one particular viewer sees it.
func (s *imageTypePreferenceTestRunner) orderedFor(viewer *testRunner, performerID uuid.UUID) []uuid.UUID {
	s.t.Helper()

	viewer.newRequest()
	performer, err := viewer.resolver.Query().FindPerformer(viewer.ctx, performerID)
	assert.NoError(s.t, err)

	images, err := viewer.resolver.Performer().Images(viewer.ctx, performer)
	assert.NoError(s.t, err)

	ids := make([]uuid.UUID, len(images))
	for i, image := range images {
		ids[i] = image.ID
	}
	return ids
}

// A gallery of three images differing only in state of dress, so that
// dimension alone decides the order.
func (s *imageTypePreferenceTestRunner) dressGallery() (uuid.UUID, map[models.ImageTypeEnum]uuid.UUID) {
	s.t.Helper()

	dressTypes := []models.ImageTypeEnum{
		models.ImageTypeEnumDressNonNude,
		models.ImageTypeEnumDressTopless,
		models.ImageTypeEnumDressNude,
	}

	byType := make(map[models.ImageTypeEnum]uuid.UUID, len(dressTypes))
	var imageIDs []uuid.UUID
	for _, dressType := range dressTypes {
		image, err := s.createTestImage(400, 600)
		assert.NoError(s.t, err)
		byType[dressType] = image.ID
		imageIDs = append(imageIDs, image.ID)
	}

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: imageIDs,
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	var assignments []models.ImageTypeAssignment
	for _, dressType := range dressTypes {
		assignments = append(assignments,
			models.ImageTypeAssignment{ImageID: byType[dressType], Type: models.ImageTypeEnumShotPortrait},
			models.ImageTypeAssignment{ImageID: byType[dressType], Type: models.ImageTypeEnumCropFace},
			models.ImageTypeAssignment{ImageID: byType[dressType], Type: dressType},
		)
	}
	s.assign(performerID, assignments...)

	return performerID, byType
}

func (s *imageTypePreferenceTestRunner) testPreferenceReordersForOwnerOnly() {
	performerID, byType := s.dressGallery()

	instanceOrder := []uuid.UUID{
		byType[models.ImageTypeEnumDressNonNude],
		byType[models.ImageTypeEnumDressTopless],
		byType[models.ImageTypeEnumDressNude],
	}

	owner := asEdit(s.t)
	bystander := asModify(s.t)

	assert.Equal(s.t, instanceOrder, s.orderedFor(owner, performerID))
	assert.Equal(s.t, instanceOrder, s.orderedFor(bystander, performerID))

	// The owner prefers topless first, then nude.
	applied, err := owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, models.ImageTypePreferencesInput{Types: []models.ImageTypeEnum{
		models.ImageTypeEnumDressTopless,
		models.ImageTypeEnumDressNude,
	}})
	assert.NoError(s.t, err)
	assert.True(s.t, applied)

	assert.Equal(s.t, []uuid.UUID{
		byType[models.ImageTypeEnumDressTopless],
		byType[models.ImageTypeEnumDressNude],
		// Unlisted, so it trails the listed ones in instance order.
		byType[models.ImageTypeEnumDressNonNude],
	}, s.orderedFor(owner, performerID), "a partial preference is well defined")

	// Dataloaders are built per request, so one viewer's ordering cannot leak
	// into another's even in the same process.
	assert.Equal(s.t, instanceOrder, s.orderedFor(bystander, performerID),
		"another user's ordering must be untouched")

	// And it round-trips through the user field.
	me, err := owner.resolver.Query().Me(owner.ctx)
	assert.NoError(s.t, err)
	preferences, err := owner.resolver.User().ImageTypePreferences(owner.ctx, me)
	assert.NoError(s.t, err)
	assert.Equal(s.t, []models.ImageTypeEnum{
		models.ImageTypeEnumDressTopless,
		models.ImageTypeEnumDressNude,
	}, preferences)

	// An empty list clears it, returning the owner to the instance ordering.
	_, err = owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, clearPreferences())
	assert.NoError(s.t, err)

	assert.Equal(s.t, instanceOrder, s.orderedFor(owner, performerID), "an empty list clears the preference")

	preferences, err = owner.resolver.User().ImageTypePreferences(owner.ctx, me)
	assert.NoError(s.t, err)
	assert.Empty(s.t, preferences)
}

// A type preference reorders within a dimension and nothing more: promoting a
// crop cannot lift a detail shot past a portrait, because that is decided by
// Shot type. Reordering the dimensions needs a group preference.
func (s *imageTypePreferenceTestRunner) testPreferenceCannotOutrankGroups() {
	detail, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	portrait, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{detail.ID, portrait.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	s.assign(performerID,
		// A tattoo close-up that is also a face crop.
		models.ImageTypeAssignment{ImageID: detail.ID, Type: models.ImageTypeEnumShotDetail},
		models.ImageTypeAssignment{ImageID: detail.ID, Type: models.ImageTypeEnumCropFace},
		// A portrait cropped less tightly.
		models.ImageTypeAssignment{ImageID: portrait.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: portrait.ID, Type: models.ImageTypeEnumCropBust},
	)

	viewer := asEdit(s.t)

	// Even preferring face crops above everything, Shot type outranks Crop and
	// the preference cannot promote a detail shot past a portrait.
	_, err = viewer.resolver.Mutation().UpdateImageTypePreferences(viewer.ctx, models.ImageTypePreferencesInput{Types: []models.ImageTypeEnum{
		models.ImageTypeEnumCropFace,
	}})
	assert.NoError(s.t, err)
	defer func() {
		_, _ = viewer.resolver.Mutation().UpdateImageTypePreferences(viewer.ctx, clearPreferences())
	}()

	assert.Equal(s.t, []uuid.UUID{portrait.ID, detail.ID}, s.orderedFor(viewer, performerID),
		"a type preference must not reorder groups")
}

// A gallery where Crop and State of dress disagree about which image leads, so
// whichever dimension is compared first decides.
func (s *imageTypePreferenceTestRunner) disagreeingGallery() (uuid.UUID, uuid.UUID, uuid.UUID) {
	s.t.Helper()

	faceNude, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	wideClothed, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{faceNude.ID, wideClothed.ID},
	})
	assert.NoError(s.t, err)

	s.assign(performer.UUID(),
		// Wins on Crop, loses on State of dress.
		models.ImageTypeAssignment{ImageID: faceNude.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: faceNude.ID, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: faceNude.ID, Type: models.ImageTypeEnumDressNude},
		// And the reverse.
		models.ImageTypeAssignment{ImageID: wideClothed.ID, Type: models.ImageTypeEnumShotPortrait},
		models.ImageTypeAssignment{ImageID: wideClothed.ID, Type: models.ImageTypeEnumCropWide},
		models.ImageTypeAssignment{ImageID: wideClothed.ID, Type: models.ImageTypeEnumDressNonNude},
	)

	return performer.UUID(), faceNude.ID, wideClothed.ID
}

// Promoting a dimension is what a type preference alone cannot do: it decides
// which comparison happens first rather than breaking ties inside one.
func (s *imageTypePreferenceTestRunner) testGroupPreferenceReordersDimensions() {
	performerID, faceNude, wideClothed := s.disagreeingGallery()

	owner := asEdit(s.t)
	bystander := asModify(s.t)

	// Crop is compared before State of dress, so the face crop leads.
	assert.Equal(s.t, []uuid.UUID{faceNude, wideClothed}, s.orderedFor(owner, performerID))

	_, err := owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, models.ImageTypePreferencesInput{
		Groups: []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumDress},
	})
	assert.NoError(s.t, err)
	defer func() {
		_, _ = owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, clearPreferences())
	}()

	assert.Equal(s.t, []uuid.UUID{wideClothed, faceNude}, s.orderedFor(owner, performerID),
		"promoting State of dress should decide the order before Crop does")

	assert.Equal(s.t, []uuid.UUID{faceNude, wideClothed}, s.orderedFor(bystander, performerID),
		"one user's group order must not reach anybody else")
}

// The thumbnail rule ranks against the instance ordering, so no amount of
// reordering by the viewer changes what other people's search results show.
// Only a group preference can test this properly: the Crop override ties that
// dimension, so a Crop preference could never have revealed which ordering was
// used.
func (s *imageTypePreferenceTestRunner) testGroupPreferenceLeavesThumbnailAlone() {
	performerID, faceNude, wideClothed := s.disagreeingGallery()

	viewer := asEdit(s.t)

	// Both preferences at once, which is what a user who has touched the screen
	// at all will have. The two are applied in layers, and the layering is
	// where Instance() can be lost: whichever is applied second must still
	// reach past the first to the unadjusted ordering.
	_, err := viewer.resolver.Mutation().UpdateImageTypePreferences(viewer.ctx, models.ImageTypePreferencesInput{
		Groups: []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumDress},
		Types:  []models.ImageTypeEnum{models.ImageTypeEnumCropWide},
	})
	assert.NoError(s.t, err)
	defer func() {
		_, _ = viewer.resolver.Mutation().UpdateImageTypePreferences(viewer.ctx, clearPreferences())
	}()

	assert.Equal(s.t, []uuid.UUID{wideClothed, faceNude}, s.orderedFor(viewer, performerID),
		"the gallery should follow the preference")

	viewer.newRequest()
	performer, err := viewer.resolver.Query().FindPerformer(viewer.ctx, performerID)
	assert.NoError(s.t, err)
	thumbnail, err := viewer.resolver.Performer().Thumbnail(viewer.ctx, performer)
	assert.NoError(s.t, err)

	if assert.NotNil(s.t, thumbnail) {
		assert.Equal(s.t, faceNude, thumbnail.ID,
			"the thumbnail must ignore the viewer's group order")
	}
}

// Groups left out trail the ones named, in instance order -- the same rule
// that applies to types, so a user need not rank all four to say one thing.
func (s *imageTypePreferenceTestRunner) testPartialGroupPreference() {
	owner := asEdit(s.t)

	_, err := owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, models.ImageTypePreferencesInput{
		Groups: []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumDress},
	})
	assert.NoError(s.t, err)
	defer func() {
		_, _ = owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, clearPreferences())
	}()

	owner.newRequest()
	me, err := owner.resolver.Query().Me(owner.ctx)
	assert.NoError(s.t, err)

	stored, err := owner.resolver.User().ImageTypeGroupPreferences(owner.ctx, me)
	assert.NoError(s.t, err)
	assert.Equal(s.t, []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumDress}, stored,
		"only what the user named is stored")

	// Clearing returns them to the instance ordering.
	_, err = owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, clearPreferences())
	assert.NoError(s.t, err)

	owner.newRequest()
	me, err = owner.resolver.Query().Me(owner.ctx)
	assert.NoError(s.t, err)
	stored, err = owner.resolver.User().ImageTypeGroupPreferences(owner.ctx, me)
	assert.NoError(s.t, err)
	assert.Empty(s.t, stored)
}

func TestGroupPreferenceReordersDimensions(t *testing.T) {
	s := createImageTypePreferenceTestRunner(t)
	s.testGroupPreferenceReordersDimensions()
}

func TestGroupPreferenceLeavesThumbnailAlone(t *testing.T) {
	s := createImageTypePreferenceTestRunner(t)
	s.testGroupPreferenceLeavesThumbnailAlone()
}

func TestPartialGroupPreference(t *testing.T) {
	s := createImageTypePreferenceTestRunner(t)
	s.testPartialGroupPreference()
}

func TestPreferenceReordersForOwnerOnly(t *testing.T) {
	s := createImageTypePreferenceTestRunner(t)
	s.testPreferenceReordersForOwnerOnly()
}

func TestPreferenceCannotOutrankGroups(t *testing.T) {
	s := createImageTypePreferenceTestRunner(t)
	s.testPreferenceCannotOutrankGroups()
}

// A disabled dimension stops deciding anything. The gallery in
// disagreeingGallery is ordered by Crop; switching Crop off should hand the
// decision to State of dress, the next enabled group.
func (s *imageTypePreferenceTestRunner) testDisabledGroupDropsOutOfRanking() {
	performerID, faceNude, wideClothed := s.disagreeingGallery()

	admin := asAdmin(s.t)
	defer func() {
		_, _ = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{})
	}()

	viewer := asRead(s.t)
	assert.Equal(s.t, []uuid.UUID{faceNude, wideClothed}, s.orderedFor(viewer, performerID),
		"Crop decides while it is in use")

	_, err := admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledGroups: []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumCrop},
	})
	assert.NoError(s.t, err)

	assert.Equal(s.t, []uuid.UUID{wideClothed, faceNude}, s.orderedFor(viewer, performerID),
		"with Crop off, State of dress decides instead")

	// One type off, its group still in use: Crop keeps deciding, but the image
	// whose only crop label was the disabled one now has nothing to be ranked
	// on and falls behind. Asserted separately from the group case because a
	// disabled group would hide the type anyway -- this is the only way to see
	// the type's own flag doing the work.
	_, err = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledTypes: []models.ImageTypeEnum{models.ImageTypeEnumCropFace},
	})
	assert.NoError(s.t, err)

	assert.Equal(s.t, []uuid.UUID{wideClothed, faceNude}, s.orderedFor(viewer, performerID),
		"an image loses its place when the type it was ranked on is switched off")

	// And the labels are still there: switching it back on restores the
	// original order rather than leaving the gallery permanently rearranged.
	_, err = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{})
	assert.NoError(s.t, err)

	assert.Equal(s.t, []uuid.UUID{faceNude, wideClothed}, s.orderedFor(viewer, performerID),
		"re-enabling is lossless")
}

func TestDisabledGroupDropsOutOfRanking(t *testing.T) {
	s := createImageTypePreferenceTestRunner(t)
	s.testDisabledGroupDropsOutOfRanking()
}

// clearPreferences states both lists as empty. Absent and empty are different
// answers for groups -- absent leaves whatever the user had -- so a test that
// means "clear" has to say so.
func clearPreferences() models.ImageTypePreferencesInput {
	return models.ImageTypePreferencesInput{
		Types:  []models.ImageTypeEnum{},
		Groups: []models.ImageTypeGroupEnum{},
	}
}

// The group list is not defaulted, so a client updating only its type
// order threw away a group order it had never mentioned. Absent now means what
// it says.
func (s *imageTypePreferenceTestRunner) testTypeUpdateKeepsGroupPreference() {
	owner := asRead(s.t)
	defer func() {
		_, _ = owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, clearPreferences())
	}()

	_, err := owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, models.ImageTypePreferencesInput{
		Types:  []models.ImageTypeEnum{},
		Groups: []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumDress},
	})
	assert.NoError(s.t, err)

	// Types only, saying nothing about groups.
	_, err = owner.resolver.Mutation().UpdateImageTypePreferences(owner.ctx, models.ImageTypePreferencesInput{
		Types: []models.ImageTypeEnum{models.ImageTypeEnumDressNude},
	})
	assert.NoError(s.t, err)

	owner.newRequest()
	me, err := owner.resolver.Query().Me(owner.ctx)
	assert.NoError(s.t, err)

	groups, err := owner.resolver.User().ImageTypeGroupPreferences(owner.ctx, me)
	assert.NoError(s.t, err)
	assert.Equal(s.t, []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumDress}, groups,
		"a type-only update must not clear the group preference")

	types, err := owner.resolver.User().ImageTypePreferences(owner.ctx, me)
	assert.NoError(s.t, err)
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumDressNude}, types)
}

func TestTypeUpdateKeepsGroupPreference(t *testing.T) {
	s := createImageTypePreferenceTestRunner(t)
	s.testTypeUpdateKeepsGroupPreference()
}
