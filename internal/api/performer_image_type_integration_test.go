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

	s.assign(performer.UUID(), labels(image.ID, types...)...)

	return performer.UUID(), image.ID
}

// assign replaces the performer's assignments wholesale, so every image the
// test cares about has to be named in one call.
func (s *performerImageTypeTestRunner) assign(performerID uuid.UUID, assignments ...models.ImageTypeAssignment) {
	s.t.Helper()

	err := dbtest.Factory().ImageType().SetPerformerAssignments(s.ctx, performerID, assignments)
	assert.NoError(s.t, err)
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

	typedImages, err := s.resolver.Performer().TypedImages(s.ctx, performer)
	assert.NoError(s.t, err)

	byImage := make(map[uuid.UUID][]models.ImageTypeEnum, len(typedImages))
	for _, typedImage := range typedImages {
		byImage[typedImage.Image.ID] = typedImage.Types
	}
	return byImage
}

// The point of task 4: an edit that says nothing about images must not destroy
// their labels. updateImagesFromEdit truncates performer_images on every
// applied edit, and the assignments cascade with it.
func (s *performerImageTypeTestRunner) testAssignmentsSurviveNameOnlyEdit() {
	performerID, imageID := s.createLabelledPerformer(
		models.ImageTypeEnumShotPortrait, models.ImageTypeEnumCropFace)

	assert.Equal(s.t, []models.ImageTypeEnum{
		models.ImageTypeEnumShotPortrait,
		models.ImageTypeEnumCropFace,
	}, s.typesOf(performerID)[imageID])

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

	assert.Equal(s.t, []models.ImageTypeEnum{
		models.ImageTypeEnumShotPortrait,
		models.ImageTypeEnumCropFace,
	}, s.typesOf(performerID)[imageID], "labels should survive an edit that never mentions images")
}

// Removal is scoped by the composite foreign key: one performer losing an
// image must not disturb another performer's labels on the same image.
func (s *performerImageTypeTestRunner) testRemovingImageDropsOnlyThatPerformersAssignments() {
	keeperID, imageID := s.createLabelledPerformer(models.ImageTypeEnumCropBust)

	// A second performer carrying the same image, labelled differently.
	loser, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{imageID},
	})
	assert.NoError(s.t, err)
	loserID := loser.UUID()
	s.assign(loserID, labels(imageID, models.ImageTypeEnumDressNude)...)

	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumDressNude}, s.typesOf(loserID)[imageID])

	ctx := s.updateContext([]string{"image_ids"})
	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       loserID,
		ImageIds: []uuid.UUID{},
	})
	assert.NoError(s.t, err)

	assert.Empty(s.t, s.typesOf(loserID), "the image and its labels should be gone")
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropBust}, s.typesOf(keeperID)[imageID],
		"the other performer's labels for the same image should be untouched")

	// Re-adding is what makes an orphaned assignment observable. Every read
	// joins through performer_images, so an assignment that outlived its join
	// row is invisible until the image comes back -- and then the old labels
	// silently resurrect. Asserting emptiness above would pass either way.
	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       loserID,
		ImageIds: []uuid.UUID{imageID},
	})
	assert.NoError(s.t, err)

	assert.Empty(s.t, s.typesOf(loserID)[imageID], "removed labels must not resurrect when the image is re-added")
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

func (s *performerImageTypeTestRunner) testDirectWriteAcceptsOnePerGroup() {
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

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: image.ID, Types: oneEach},
		},
	})
	assert.NoError(s.t, err)

	assert.ElementsMatch(s.t, oneEach, s.typesOf(performer.UUID())[image.ID])
}

// Enforced on the direct mutation, not only through an edit. The edit path
// looking covered is exactly why this one gets skipped.
func (s *performerImageTypeTestRunner) testDirectWriteRejectsGroupConflict() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	ctx := s.updateContext([]string{"image_ids", "image_types"})

	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: []uuid.UUID{image.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: image.ID, Types: []models.ImageTypeEnum{
				models.ImageTypeEnumCropFace,
				models.ImageTypeEnumCropWide,
			}},
		},
	})
	assert.ErrorContains(s.t, err, "CROP allows at most one")

	// Labelling an image the performer does not have is refused: the composite
	// foreign key would reject it anyway, but with a constraint violation
	// rather than something an editor can act on.
	stranger, err := uuid.NewV7()
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: []uuid.UUID{image.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: stranger, Types: []models.ImageTypeEnum{models.ImageTypeEnumCropFace}},
		},
	})
	assert.ErrorContains(s.t, err, "not one of this entity's images")
}

// Cross-group impossibilities. Group exclusivity above catches a group
// contradicting itself; this catches one group contradicting another.
func (s *performerImageTypeTestRunner) testDirectWriteRejectsImpossibleCombination() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	ctx := s.updateContext([]string{"image_ids", "image_types"})

	assign := func(types ...models.ImageTypeEnum) error {
		_, err := s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
			ID:         performerID,
			ImageIds:   []uuid.UUID{image.ID},
			ImageTypes: []models.ImageAssignmentInput{{ImageID: image.ID, Types: types}},
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
		// Nothing that stops at the hips can make the genital area the focus.
		{"face and explicit", []models.ImageTypeEnum{
			models.ImageTypeEnumCropFace, models.ImageTypeEnumDressExplicit}},
		{"bust and explicit", []models.ImageTypeEnum{
			models.ImageTypeEnumCropBust, models.ImageTypeEnumDressExplicit}},
		{"torso and explicit", []models.ImageTypeEnum{
			models.ImageTypeEnumCropTorso, models.ImageTypeEnumDressExplicit}},
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
		// Deliberately lenient, not an oversight. A crop stopping at the hips
		// cannot strictly establish Nude -- in theory such an image is only
		// Topless -- but in practice the two are hard to tell apart, and the
		// rules only forbid what the frame makes impossible. Asserted so that
		// anyone reading the conflict table as incomplete finds the decision
		// here before adding the pair.
		{models.ImageTypeEnumCropTorso, models.ImageTypeEnumDressNude},
		{models.ImageTypeEnumCropBust, models.ImageTypeEnumDressNude},
	}

	for _, types := range accepted {
		assert.NoError(s.t, assign(types...), "%v should be allowed", types)
	}
}

// The distinction that decides whether existing MODIFY-role clients, which
// know nothing of this field, wipe a gallery's labelling on their next call.
func (s *performerImageTypeTestRunner) testDirectWriteAbsentVersusEmpty() {
	labelled, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	untouched, err := s.createTestImage(600, 400)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{labelled.ID, untouched.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	s.assign(performerID,
		models.ImageTypeAssignment{ImageID: labelled.ID, Type: models.ImageTypeEnumShotCandid},
		models.ImageTypeAssignment{ImageID: untouched.ID, Type: models.ImageTypeEnumCropWide},
	)

	bothImages := []uuid.UUID{labelled.ID, untouched.ID}

	// Absent: what every client predating this feature sends.
	ctx := s.updateContext([]string{"image_ids"})
	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: bothImages,
	})
	assert.NoError(s.t, err)

	after := s.typesOf(performerID)
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}, after[labelled.ID],
		"absent image_types must leave assignments alone")
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropWide}, after[untouched.ID])

	// Non-empty, naming only one image: the other keeps what it has.
	typedCtx := s.updateContext([]string{"image_ids", "image_types"})
	_, err = s.resolver.Mutation().PerformerUpdate(typedCtx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: bothImages,
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: labelled.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotDetail}},
		},
	})
	assert.NoError(s.t, err)

	after = s.typesOf(performerID)
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotDetail}, after[labelled.ID],
		"a named image is authoritative")
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropWide}, after[untouched.ID],
		"an image in image_ids with no image_types entry keeps its labels")

	// An entry with no types clears just that image.
	_, err = s.resolver.Mutation().PerformerUpdate(typedCtx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: bothImages,
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: labelled.ID, Types: []models.ImageTypeEnum{}},
		},
	})
	assert.NoError(s.t, err)

	after = s.typesOf(performerID)
	assert.Empty(s.t, after[labelled.ID], "an entry with no types clears that image")
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropWide}, after[untouched.ID])

	// An empty list clears everything.
	_, err = s.resolver.Mutation().PerformerUpdate(typedCtx, models.PerformerUpdateInput{
		ID:         performerID,
		ImageIds:   bothImages,
		ImageTypes: []models.ImageAssignmentInput{},
	})
	assert.NoError(s.t, err)

	after = s.typesOf(performerID)
	assert.Empty(s.t, after[labelled.ID])
	assert.Empty(s.t, after[untouched.ID], "an empty image_types clears every assignment")
}

func TestAssignmentsSurviveNameOnlyEdit(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testAssignmentsSurviveNameOnlyEdit()
}

func TestRemovingImageDropsOnlyThatPerformersAssignments(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testRemovingImageDropsOnlyThatPerformersAssignments()
}

func TestUnlabelledImageIsStillTyped(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testUnlabelledImageIsStillTyped()
}

func TestDirectWriteAcceptsOnePerGroup(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testDirectWriteAcceptsOnePerGroup()
}

func TestDirectWriteRejectsGroupConflict(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testDirectWriteRejectsGroupConflict()
}

func TestDirectWriteAbsentVersusEmpty(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testDirectWriteAbsentVersusEmpty()
}

func TestDirectWriteRejectsImpossibleCombination(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testDirectWriteRejectsImpossibleCombination()
}

// Assigning something the instance has switched off is refused rather than
// quietly dropped: a client that has cached the vocabulary should be told.
func (s *performerImageTypeTestRunner) testDirectWriteRejectsDisabledType() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)

	admin := asAdmin(s.t)
	defer func() {
		_, _ = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{})
	}()

	_, err = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledTypes: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	ctx := s.updateContext([]string{"image_ids", "image_types"})
	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performer.UUID(),
		ImageIds: []uuid.UUID{image.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: image.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}},
		},
	})
	assert.ErrorContains(s.t, err, "not enabled on this instance")

	// A type in a disabled group is refused too, without having been listed.
	_, err = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledGroups: []models.ImageTypeGroupEnum{models.ImageTypeGroupEnumPosture},
	})
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performer.UUID(),
		ImageIds: []uuid.UUID{image.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: image.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumPostureStanding}},
		},
	})
	assert.ErrorContains(s.t, err, "not enabled on this instance")
}

func TestDirectWriteRejectsDisabledType(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testDirectWriteRejectsDisabledType()
}

// Switching a type off must not strand the performers already carrying it.
// Every save restates the labels an image has, so refusing those outright would
// make the performer unsaveable -- and the label unremovable, because the only
// way to drop it is a save.
func (s *performerImageTypeTestRunner) testDirectWriteKeepsDisabledTypeAlreadyAssigned() {
	performerID, imageID := s.createLabelledPerformer(models.ImageTypeEnumShotCandid)

	admin := asAdmin(s.t)
	defer func() {
		_, _ = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{})
	}()

	_, err := admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledTypes: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	// An unrelated field, restating the labels the way the form does.
	renamed := s.generatePerformerName()
	ctx := s.updateContext([]string{"name", "image_ids", "image_types"})
	updated, err := s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performerID,
		Name:     &renamed,
		ImageIds: []uuid.UUID{imageID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: imageID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}},
		},
	})
	if assert.NoError(s.t, err) {
		assert.Equal(s.t, renamed, updated.Name)
	}

	// The label survives, so the editor can still see it and drop it.
	assert.Equal(s.t, map[uuid.UUID][]models.ImageTypeEnum{
		imageID: {models.ImageTypeEnumShotCandid},
	}, s.typesOf(performerID))

	// Dropping it is what the grandfathering is for, and it still works.
	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:         performerID,
		Name:       &renamed,
		ImageIds:   []uuid.UUID{imageID},
		ImageTypes: []models.ImageAssignmentInput{{ImageID: imageID}},
	})
	assert.NoError(s.t, err)
	assert.Empty(s.t, s.typesOf(performerID)[imageID])
}

func TestDirectWriteKeepsDisabledTypeAlreadyAssigned(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testDirectWriteKeepsDisabledTypeAlreadyAssigned()
}

// Grandfathering is per image, not per instance: keeping a switched-off label
// where it already is says nothing about spreading it somewhere new.
func (s *performerImageTypeTestRunner) testDirectWriteRejectsDisabledTypeOnAnotherImage() {
	performerID, imageID := s.createLabelledPerformer(models.ImageTypeEnumShotCandid)

	fresh, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	admin := asAdmin(s.t)
	defer func() {
		_, _ = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{})
	}()

	_, err = admin.resolver.Mutation().ImageTypeSetEnabled(admin.ctx, models.ImageTypeEnabledInput{
		DisabledTypes: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(s.t, err)

	ctx := s.updateContext([]string{"image_ids", "image_types"})
	_, err = s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:       performerID,
		ImageIds: []uuid.UUID{imageID, fresh.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: imageID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}},
			{ImageID: fresh.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}},
		},
	})
	assert.ErrorContains(s.t, err, "not enabled on this instance")
}

func TestDirectWriteRejectsDisabledTypeOnAnotherImage(t *testing.T) {
	s := createPerformerImageTypeTestRunner(t)
	s.testDirectWriteRejectsDisabledTypeOnAnotherImage()
}
