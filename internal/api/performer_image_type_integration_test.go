//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type performerImageTypeTestRunner struct {
	testRunner
}

func createPerformerImageTypeTestRunner(t *testing.T) *performerImageTypeTestRunner {
	return &performerImageTypeTestRunner{
		testRunner: *asAdmin(t),
	}
}

// createLabelledPerformer makes a performer carrying one uploaded image with
// the given labels.
func (s *performerImageTypeTestRunner) createLabelledPerformer(types ...models.ImageTypeEnum) (uuid.UUID, uuid.UUID) {
	s.t.Helper()

	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)

	s.assign(labels(image.ID, types...)...)

	return performer.UUID(), image.ID
}

// assign groups assignments by image and writes each named image's labels
// wholesale, bypassing validation: labels are a property of the image now,
// not of any one performer's relationship to it, and fixture setup for
// ranking/preference tests intentionally uses combinations the real
// imageUpdate mutation would reject, to isolate the dimension under test.
func (s *performerImageTypeTestRunner) assign(assignments ...models.ImageTypeAssignment) {
	s.t.Helper()

	byImage := make(map[uuid.UUID][]models.ImageTypeEnum)
	var order []uuid.UUID
	for _, a := range assignments {
		if _, seen := byImage[a.ImageID]; !seen {
			order = append(order, a.ImageID)
		}
		byImage[a.ImageID] = append(byImage[a.ImageID], a.Type)
	}

	for _, imageID := range order {
		err := dbtest.Factory().ImageType().SetAssignments(s.ctx, imageID, byImage[imageID])
		assert.NoError(s.t, err)
	}
}

func labels(imageID uuid.UUID, types ...models.ImageTypeEnum) []models.ImageTypeAssignment {
	assignments := make([]models.ImageTypeAssignment, len(types))
	for i, imageType := range types {
		assignments[i] = models.ImageTypeAssignment{ImageID: imageID, Type: imageType}
	}
	return assignments
}

func (s *performerImageTypeTestRunner) typesOf(performerID uuid.UUID) map[uuid.UUID][]models.ImageTypeEnum {
	s.t.Helper()

	s.newRequest()
	performer, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(s.t, err)

	images, err := s.resolver.Performer().Images(s.ctx, performer)
	assert.NoError(s.t, err)

	byImage := make(map[uuid.UUID][]models.ImageTypeEnum, len(images))
	for i := range images {
		types, err := s.resolver.Image().Types(s.ctx, &images[i])
		assert.NoError(s.t, err)
		byImage[images[i].ID] = types
	}
	return byImage
}

func (s *performerImageTypeTestRunner) testUnlabelledImageIsStillTyped() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)

	// Untyped is a permanent, valid state: the image still appears, with no
	// labels, rather than being omitted.
	byImage := s.typesOf(performer.UUID())
	assert.Len(s.t, byImage, 1)
	assert.Empty(s.t, byImage[image.ID])
}

func TestUnlabelledImageIsStillTyped(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testUnlabelledImageIsStillTyped()
}

// Labels live on the image itself now, not on the performer relationship:
// removing an image from every performer that had it must not clear its
// labels, since the same row could still be referenced elsewhere.
func (s *performerImageTypeTestRunner) testLabelsSurviveDetachingFromEveryPerformer() {
	performerID, imageID := s.createLabelledPerformer(models.ImageTypeEnumCropBust)

	ctx := s.updateContext([]string{"image_ids"})
	_, err := s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: []uuid.UUID{},
	})
	assert.NoError(s.t, err)

	s.newRequest()
	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: imageID})
	assert.NoError(s.t, err)
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropBust}, types,
		"labels are a property of the image, unaffected by detaching it from a performer")
}

func TestLabelsSurviveDetachingFromEveryPerformer(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testLabelsSurviveDetachingFromEveryPerformer()
}

func (s *performerImageTypeTestRunner) testImageUpdateAcceptsOnePerGroup() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	// One from every group, and a combination that is actually possible: a
	// three-quarter crop rather than a face, because a collarbone-up frame
	// cannot establish an uncovered chest and the conflict rules reject it.
	oneEach := []models.ImageTypeEnum{
		models.ImageTypeEnumShotPortrait,
		models.ImageTypeEnumCropThreeQuarter,
		models.ImageTypeEnumViewFront,
		models.ImageTypeEnumPostureStanding,
		models.ImageTypeEnumDressNude,
	}

	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    image.ID,
		Types: oneEach,
	})
	assert.NoError(s.t, err)

	s.newRequest()
	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: image.ID})
	assert.NoError(s.t, err)
	assert.ElementsMatch(s.t, oneEach, types)
}

func TestImageUpdateAcceptsOnePerGroup(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testImageUpdateAcceptsOnePerGroup()
}

func (s *performerImageTypeTestRunner) testImageUpdateRejectsGroupConflict() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID: image.ID,
		Types: []models.ImageTypeEnum{
			models.ImageTypeEnumCropFace,
			models.ImageTypeEnumCropWide,
		},
	})
	assert.ErrorContains(s.t, err, "CROP allows at most one")
}

func TestImageUpdateRejectsGroupConflict(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testImageUpdateRejectsGroupConflict()
}

// Cross-group impossibilities. Group exclusivity above catches a group
// contradicting itself; this catches one group contradicting another.
func (s *performerImageTypeTestRunner) testImageUpdateRejectsImpossibleCombination() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	assign := func(types ...models.ImageTypeEnum) error {
		_, err := s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
			ID:    image.ID,
			Types: types,
		})
		return err
	}

	rejected := []struct {
		name  string
		types []models.ImageTypeEnum
	}{
		// A collarbone-up frame cannot show an uncovered chest.
		{"face and topless", []models.ImageTypeEnum{
			models.ImageTypeEnumCropFace, models.ImageTypeEnumDressTopless}},
		{"face and nude", []models.ImageTypeEnum{
			models.ImageTypeEnumCropFace, models.ImageTypeEnumDressNude}},
		// Nude and Explicit both need the chest and the genital area, so
		// nothing down to and including Torso -- which stops at the hips --
		// can carry either.
		{"face and explicit", []models.ImageTypeEnum{
			models.ImageTypeEnumCropFace, models.ImageTypeEnumDressExplicit}},
		{"bust and explicit", []models.ImageTypeEnum{
			models.ImageTypeEnumCropBust, models.ImageTypeEnumDressExplicit}},
		{"torso and explicit", []models.ImageTypeEnum{
			models.ImageTypeEnumCropTorso, models.ImageTypeEnumDressExplicit}},
		{"bust and nude", []models.ImageTypeEnum{
			models.ImageTypeEnumCropBust, models.ImageTypeEnumDressNude}},
		{"torso and nude", []models.ImageTypeEnum{
			models.ImageTypeEnumCropTorso, models.ImageTypeEnumDressNude}},
		// A face crop is defined by having a face in it.
		{"face and back", []models.ImageTypeEnum{
			models.ImageTypeEnumCropFace, models.ImageTypeEnumViewBack}},
	}

	for _, testCase := range rejected {
		err := assign(testCase.types...)
		assert.ErrorContains(s.t, err, "cannot be both", testCase.name)
	}

	// Order must not matter: the pair is seeded one way round and checked
	// both, so listing it the other way is rejected just the same.
	assert.ErrorContains(s.t, assign(
		models.ImageTypeEnumDressExplicit, models.ImageTypeEnumCropTorso,
	), "cannot be both", "reversed")

	accepted := [][]models.ImageTypeEnum{
		// The looser crops carry every state of dress.
		{models.ImageTypeEnumCropThreeQuarter, models.ImageTypeEnumDressExplicit},
		{models.ImageTypeEnumCropFullBody, models.ImageTypeEnumDressExplicit},
		// A profile headshot is ordinary; only Back is impossible.
		{models.ImageTypeEnumCropFace, models.ImageTypeEnumViewSide},
		// Face and non-nude is the commonest label there is.
		{models.ImageTypeEnumCropFace, models.ImageTypeEnumDressNonNude},
		// A bust crop showing an uncovered chest is exactly what Topless is.
		{models.ImageTypeEnumCropBust, models.ImageTypeEnumDressTopless},
		// The trap the thumbnail rule exists for must stay legal.
		{models.ImageTypeEnumShotDetail, models.ImageTypeEnumCropFace},
	}

	for _, types := range accepted {
		assert.NoError(s.t, assign(types...), "%v should be allowed", types)
	}
}

func TestImageUpdateRejectsImpossibleCombination(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testImageUpdateRejectsImpossibleCombination()
}

// imageUpdate has one behaviour, not the three-way absent/null/empty table
// the old per-entity write paths needed: types always replaces the image's
// full label set.
func (s *performerImageTypeTestRunner) testImageUpdateReplacesLabelsWholesale() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    image.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid, models.ImageTypeEnumCropWide},
	})
	assert.NoError(s.t, err)

	s.newRequest()
	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: image.ID})
	assert.NoError(s.t, err)
	assert.ElementsMatch(s.t, []models.ImageTypeEnum{
		models.ImageTypeEnumShotCandid, models.ImageTypeEnumCropWide,
	}, types)

	// Sending a shorter list drops whatever it leaves out.
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    image.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	s.newRequest()
	types, err = s.resolver.Image().Types(s.ctx, &models.Image{ID: image.ID})
	assert.NoError(s.t, err)
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}, types)

	// An empty list clears everything.
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    image.ID,
		Types: []models.ImageTypeEnum{},
	})
	assert.NoError(s.t, err)

	s.newRequest()
	types, err = s.resolver.Image().Types(s.ctx, &models.Image{ID: image.ID})
	assert.NoError(s.t, err)
	assert.Empty(s.t, types)
}

func TestImageUpdateReplacesLabelsWholesale(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testImageUpdateReplacesLabelsWholesale()
}

// Assigning something the instance has switched off is refused rather than
// quietly dropped: a client that has cached the vocabulary should be told.
func (s *performerImageTypeTestRunner) testImageUpdateRejectsDisabledType() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	admin := asAdmin(s.t)
	defer s.restoreEnabled()

	_, err = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledTypes: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    image.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.ErrorContains(s.t, err, "not enabled on this instance")

	// A type in a disabled group is refused too, without having been listed.
	_, err = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledGroups: []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumPosture},
	})
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    image.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumPostureStanding},
	})
	assert.ErrorContains(s.t, err, "not enabled on this instance")
}

func TestImageUpdateRejectsDisabledType(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testImageUpdateRejectsDisabledType()
}

// Switching a type off must not strand the images already carrying it. Every
// save restates an image's labels, so refusing those outright would make the
// image unsaveable -- and the label unremovable, because the only way to drop
// it is a save.
func (s *performerImageTypeTestRunner) testImageUpdateKeepsDisabledTypeAlreadyAssigned() {
	_, imageID := s.createLabelledPerformer(models.ImageTypeEnumShotCandid)

	admin := asAdmin(s.t)
	defer s.restoreEnabled()

	_, err := admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledTypes: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	// Restating the same labels, the way a form resubmit does.
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	s.newRequest()
	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: imageID})
	assert.NoError(s.t, err)
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}, types,
		"the label survives, so the editor can still see it and drop it")

	// Dropping it is what the grandfathering is for, and it still works.
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: []models.ImageTypeEnum{},
	})
	assert.NoError(s.t, err)

	s.newRequest()
	types, err = s.resolver.Image().Types(s.ctx, &models.Image{ID: imageID})
	assert.NoError(s.t, err)
	assert.Empty(s.t, types)
}

func TestImageUpdateKeepsDisabledTypeAlreadyAssigned(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testImageUpdateKeepsDisabledTypeAlreadyAssigned()
}

// Grandfathering is per image, not per instance: keeping a switched-off label
// where it already is says nothing about spreading it somewhere new.
func (s *performerImageTypeTestRunner) testImageUpdateRejectsDisabledTypeOnAnotherImage() {
	_, imageID := s.createLabelledPerformer(models.ImageTypeEnumShotCandid)

	fresh, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	admin := asAdmin(s.t)
	defer s.restoreEnabled()

	_, err = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledTypes: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	// The already-labelled image keeps working...
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    imageID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	// ...but the same type on a fresh image is refused.
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    fresh.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.ErrorContains(s.t, err, "not enabled on this instance")
}

func TestImageUpdateRejectsDisabledTypeOnAnotherImage(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testImageUpdateRejectsDisabledTypeOnAnotherImage()
}
