//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type performerEditImageTypeTestRunner struct {
	performerImageTypeTestRunner
}

func createPerformerEditImageTypeTestRunner(t *testing.T) *performerEditImageTypeTestRunner {
	return &performerEditImageTypeTestRunner{
		performerImageTypeTestRunner: *createPerformerImageTypeTestRunner(t),
	}
}

// applyPerformerEdit submits a modify edit and approves it.
func (s *performerEditImageTypeTestRunner) applyPerformerEdit(performerID uuid.UUID, details *models.PerformerEditDetailsInput) {
	s.t.Helper()

	edit, err := s.createTestPerformerEdit(
		models.OperationEnumModify,
		details,
		&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		nil,
	)
	// Returns rather than reads through the nil edit, so a refused edit fails
	// this one test instead of panicking the whole package run.
	if !assert.NoError(s.t, err) {
		return
	}

	_, err = s.approveEdit(edit.ID)
	assert.NoError(s.t, err)
}

func (s *performerEditImageTypeTestRunner) testEditAddsImageWithLabels() {
	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name: s.generatePerformerName(),
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	s.applyPerformerEdit(performerID, &models.PerformerEditDetailsInput{
		ImageIds: []uuid.UUID{image.ID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: image.ID, Types: []models.ImageTypeEnum{
				models.ImageTypeEnumShotPortrait,
				models.ImageTypeEnumCropFace,
			}},
		},
	})

	assert.Equal(s.t, []models.ImageTypeEnum{
		models.ImageTypeEnumShotPortrait,
		models.ImageTypeEnumCropFace,
	}, s.typesOf(performerID)[image.ID])
}

// Retagging adds one tuple and removes another; no image is added or removed.
func (s *performerEditImageTypeTestRunner) testEditRetagsExistingImage() {
	performerID, imageID := s.createLabelledPerformer(
		models.ImageTypeEnumShotPortrait, models.ImageTypeEnumCropFace)

	s.applyPerformerEdit(performerID, &models.PerformerEditDetailsInput{
		ImageIds: []uuid.UUID{imageID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: imageID, Types: []models.ImageTypeEnum{
				models.ImageTypeEnumShotCandid,
				models.ImageTypeEnumCropFace,
			}},
		},
	})

	assert.Equal(s.t, []models.ImageTypeEnum{
		models.ImageTypeEnumShotCandid,
		models.ImageTypeEnumCropFace,
	}, s.typesOf(performerID)[imageID])
}

func (s *performerEditImageTypeTestRunner) testEditRemovingImageDropsItsLabels() {
	kept, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	dropped, err := s.createTestImage(600, 400)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{kept.ID, dropped.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	s.assign(performerID,
		models.ImageTypeAssignment{ImageID: kept.ID, Type: models.ImageTypeEnumCropFace},
		models.ImageTypeAssignment{ImageID: dropped.ID, Type: models.ImageTypeEnumCropWide},
	)

	// image_ids drops one image; image_types says nothing at all. The resolve
	// query restricts assignments to the edit's resulting image set, so the
	// dropped image's labels go with it.
	s.applyPerformerEdit(performerID, &models.PerformerEditDetailsInput{
		ImageIds: []uuid.UUID{kept.ID},
	})

	after := s.typesOf(performerID)
	assert.Len(s.t, after, 1)
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropFace}, after[kept.ID])
	assert.Empty(s.t, after[dropped.ID])
}

// An edit submitted before this feature has no *_image_types keys at all.
// Applying it must not disturb labels applied in the meantime -- the absent-key
// path, through both copies of the final_images CTE chain.
func (s *performerEditImageTypeTestRunner) testEditSubmittedBeforeLabelsExisted() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{image.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	// Submitted while the performer is unlabelled, so the payload carries no
	// image type keys whatsoever.
	newName := s.generatePerformerName()
	edit, err := s.createTestPerformerEdit(
		models.OperationEnumModify,
		&models.PerformerEditDetailsInput{Name: &newName},
		&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		nil,
	)
	assert.NoError(s.t, err)

	// Labels arrive after submission but before the edit is applied.
	s.assign(performerID, labels(image.ID, models.ImageTypeEnumShotDetail)...)

	_, err = s.approveEdit(edit.ID)
	assert.NoError(s.t, err)

	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotDetail},
		s.typesOf(performerID)[image.ID],
		"an edit predating image types must not clear labels applied since")
}

// The image GC parses pending-edit JSON to decide what is unreferenced. The
// new payload keys must not disturb that.
func (s *performerEditImageTypeTestRunner) testPendingEditProtectsImage() {
	image, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	unused, err := dbtest.Factory().Image().IsUnused(s.ctx, image.ID)
	assert.NoError(s.t, err)
	assert.True(s.t, unused, "an image on nothing is unused")

	name := s.generatePerformerName()
	_, err = s.createTestPerformerEdit(
		models.OperationEnumCreate,
		&models.PerformerEditDetailsInput{
			Name:     &name,
			ImageIds: []uuid.UUID{image.ID},
			ImageTypes: []models.ImageAssignmentInput{
				{ImageID: image.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumCropFace}},
			},
		},
		nil,
		nil,
	)
	assert.NoError(s.t, err)

	unused, err = dbtest.Factory().Image().IsUnused(s.ctx, image.ID)
	assert.NoError(s.t, err)
	assert.False(s.t, unused, "an image referenced only by a pending edit must be protected")
}

// Labels merge rather than clobber: each edit is resolved against current
// state at apply time, so the second to land keeps the first's work.
func (s *performerEditImageTypeTestRunner) testConcurrentLabellingMerges() {
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

	// The first image already carries a label. This is what makes the test
	// bite: a diff treating image_types as authoritative over the whole
	// gallery would emit a tuple removing it from any edit that does not
	// restate it.
	s.assign(performerID, labels(first.ID, models.ImageTypeEnumShotPortrait)...)

	// Both editors submit before either is approved. A refines the labelled
	// image; B labels the other one and names only it.
	editA, err := s.createTestPerformerEdit(
		models.OperationEnumModify,
		&models.PerformerEditDetailsInput{
			ImageIds: bothImages,
			ImageTypes: []models.ImageAssignmentInput{
				{ImageID: first.ID, Types: []models.ImageTypeEnum{
					models.ImageTypeEnumShotPortrait,
					models.ImageTypeEnumCropFace,
				}},
			},
		},
		&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		nil,
	)
	assert.NoError(s.t, err)

	editB, err := s.createTestPerformerEdit(
		models.OperationEnumModify,
		&models.PerformerEditDetailsInput{
			ImageIds: bothImages,
			ImageTypes: []models.ImageAssignmentInput{
				{ImageID: second.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumCropWide}},
			},
		},
		&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		nil,
	)
	assert.NoError(s.t, err)

	_, err = s.approveEdit(editA.ID)
	assert.NoError(s.t, err)
	_, err = s.approveEdit(editB.ID)
	assert.NoError(s.t, err)

	after := s.typesOf(performerID)
	assert.Equal(s.t, []models.ImageTypeEnum{
		models.ImageTypeEnumShotPortrait,
		models.ImageTypeEnumCropFace,
	}, after[first.ID], "the second edit to land should keep the first's labels")
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropWide}, after[second.ID])
}

// Merges carry the sources' labels in the submitted input, exactly as their
// images already do. Nothing unions at apply time.
func (s *performerEditImageTypeTestRunner) testMergeCarriesSubmittedLabels() {
	targetImage, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	sourceImage, err := s.createTestImage(600, 400)
	assert.NoError(s.t, err)

	target, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{targetImage.ID},
	})
	assert.NoError(s.t, err)
	targetID := target.UUID()
	s.assign(targetID, labels(targetImage.ID, models.ImageTypeEnumShotPortrait)...)

	source, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{sourceImage.ID},
	})
	assert.NoError(s.t, err)
	sourceID := source.UUID()
	s.assign(sourceID, labels(sourceImage.ID, models.ImageTypeEnumShotCandid)...)

	// The form prefill is the union mechanism, so the input names both images
	// and both sets of labels.
	mergeEdit, err := s.createTestPerformerEdit(
		models.OperationEnumMerge,
		&models.PerformerEditDetailsInput{
			ImageIds: []uuid.UUID{targetImage.ID, sourceImage.ID},
			ImageTypes: []models.ImageAssignmentInput{
				{ImageID: targetImage.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait}},
				{ImageID: sourceImage.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}},
			},
		},
		&models.EditInput{
			Operation:      models.OperationEnumMerge,
			ID:             &targetID,
			MergeSourceIds: []uuid.UUID{sourceID},
		},
		nil,
	)
	assert.NoError(s.t, err)

	_, err = s.approveEdit(mergeEdit.ID)
	assert.NoError(s.t, err)

	after := s.typesOf(targetID)
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait}, after[targetImage.ID])
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}, after[sourceImage.ID],
		"the source's labels should land on the target")
}

// The edit card reads image_changes, so the flat tuples have to regroup into
// one entry per image or a reviewer gets forty loose changes to correlate.
func (s *performerEditImageTypeTestRunner) testImageChangesGroupByImage() {
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

	s.assign(performerID, labels(first.ID, models.ImageTypeEnumCropWide)...)

	// One image gains two labels, loses one and gains a date; the other only
	// gains a label.
	date := "2019-06"
	edit, err := s.createTestPerformerEdit(
		models.OperationEnumModify,
		&models.PerformerEditDetailsInput{
			ImageIds: []uuid.UUID{first.ID, second.ID},
			ImageTypes: []models.ImageAssignmentInput{
				{ImageID: first.ID, Types: []models.ImageTypeEnum{
					models.ImageTypeEnumShotPortrait,
					models.ImageTypeEnumCropFace,
				}, Date: &date},
				{ImageID: second.ID, Types: []models.ImageTypeEnum{
					models.ImageTypeEnumShotCandid,
				}},
			},
		},
		&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		nil,
	)
	assert.NoError(s.t, err)

	data, err := edit.GetPerformerData()
	assert.NoError(s.t, err)

	changes, err := s.resolver.PerformerEdit().ImageChanges(s.ctx, data.New)
	assert.NoError(s.t, err)

	byImage := make(map[uuid.UUID]models.ImageAssignmentChange, len(changes))
	for _, change := range changes {
		byImage[change.Image.ID] = change
	}

	assert.Len(s.t, changes, 2, "one entry per affected image")

	assert.ElementsMatch(s.t, []models.ImageTypeEnum{
		models.ImageTypeEnumShotPortrait,
		models.ImageTypeEnumCropFace,
	}, byImage[first.ID].AddedTypes)
	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropWide},
		byImage[first.ID].RemovedTypes)
	assert.True(s.t, byImage[first.ID].DateChanged)
	if assert.NotNil(s.t, byImage[first.ID].Date) {
		assert.Equal(s.t, date, *byImage[first.ID].Date)
	}

	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
		byImage[second.ID].AddedTypes)
	assert.Empty(s.t, byImage[second.ID].RemovedTypes)
	assert.False(s.t, byImage[second.ID].DateChanged,
		"an image whose date the edit does not touch must not look changed")
}

func TestImageChangesGroupByImage(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testImageChangesGroupByImage()
}

func TestEditAddsImageWithLabels(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testEditAddsImageWithLabels()
}

func TestEditRetagsExistingImage(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testEditRetagsExistingImage()
}

func TestEditRemovingImageDropsItsLabels(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testEditRemovingImageDropsItsLabels()
}

func TestEditSubmittedBeforeLabelsExisted(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testEditSubmittedBeforeLabelsExisted()
}

func TestPendingEditProtectsImage(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testPendingEditProtectsImage()
}

func TestConcurrentLabellingMerges(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testConcurrentLabellingMerges()
}

func TestMergeCarriesSubmittedLabels(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testMergeCarriesSubmittedLabels()
}

// A newly added image had no date on this performer, so an entry saying null
// is not a date being taken away. The form restates every image's date on
// every save, so this is what an ordinary "add an image" edit looks like --
// and it was reporting "Date cleared" against a picture that never had one.
func (s *performerEditImageTypeTestRunner) testAddingAnImageWithNoDateIsNotADateChange() {
	existing, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{existing.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	added, err := s.createTestImage(600, 900)
	assert.NoError(s.t, err)

	dated, err := s.createTestImage(500, 700)
	assert.NoError(s.t, err)
	date := "2021-03"

	edit, err := s.createTestPerformerEdit(
		models.OperationEnumModify,
		&models.PerformerEditDetailsInput{
			ImageIds: []uuid.UUID{existing.ID, added.ID, dated.ID},
			ImageTypes: []models.ImageAssignmentInput{
				// Arrives labelled and undated, which is the reported case.
				{ImageID: added.ID, Types: []models.ImageTypeEnum{
					models.ImageTypeEnumShotPortrait,
				}},
				// Arrives dated. That is a change worth stating.
				{ImageID: dated.ID, Types: nil, Date: &date},
			},
		},
		&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		nil,
	)
	assert.NoError(s.t, err)

	data, err := edit.GetPerformerData()
	assert.NoError(s.t, err)

	changes, err := s.resolver.PerformerEdit().ImageChanges(s.ctx, data.New)
	assert.NoError(s.t, err)

	byImage := make(map[uuid.UUID]models.ImageAssignmentChange, len(changes))
	for _, change := range changes {
		byImage[change.Image.ID] = change
	}

	// Not recorded in the payload at all, which is the fix at its source: the
	// resolver guard below is what keeps edits already stored this way reading
	// correctly.
	for _, date := range data.New.ImageDates {
		assert.NotEqual(s.t, added.ID, date.ImageID,
			"an undated new image should not be recorded as a date change")
	}

	newImage, listed := byImage[added.ID]
	if assert.True(s.t, listed, "the added image should still be listed for its label") {
		assert.False(s.t, newImage.DateChanged,
			"a new image with no date had no date to clear")
		assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
			newImage.AddedTypes)
	}

	withDate, listed := byImage[dated.ID]
	if assert.True(s.t, listed, "an added image that arrives dated is a date change") {
		assert.True(s.t, withDate.DateChanged)
		if assert.NotNil(s.t, withDate.Date) {
			assert.Equal(s.t, date, *withDate.Date)
		}
	}
}

func TestAddingAnImageWithNoDateIsNotADateChange(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testAddingAnImageWithNoDateIsNotADateChange()
}

// The diff lightbox shows the state being voted on rather than the delta, so
// the edit has to be able to say what each image ends up carrying.
func (s *performerEditImageTypeTestRunner) testTypedImagesAreTheResultingGallery() {
	kept, err := s.createTestImage(400, 600)
	assert.NoError(s.t, err)
	dropped, err := s.createTestImage(300, 300)
	assert.NoError(s.t, err)

	performer, err := s.createTestPerformer(&models.PerformerCreateInput{
		Name:     s.generatePerformerName(),
		ImageIds: []uuid.UUID{kept.ID, dropped.ID},
	})
	assert.NoError(s.t, err)
	performerID := performer.UUID()

	s.assign(performerID, labels(kept.ID, models.ImageTypeEnumCropWide)...)

	added, err := s.createTestImage(600, 900)
	assert.NoError(s.t, err)
	date := "2022"

	edit, err := s.createTestPerformerEdit(
		models.OperationEnumModify,
		&models.PerformerEditDetailsInput{
			// dropped is left out, so the edit removes it.
			ImageIds: []uuid.UUID{kept.ID, added.ID},
			ImageTypes: []models.ImageAssignmentInput{
				{ImageID: kept.ID, Types: []models.ImageTypeEnum{
					models.ImageTypeEnumCropFace,
				}, Date: &date},
				{ImageID: added.ID, Types: []models.ImageTypeEnum{
					models.ImageTypeEnumShotPortrait,
				}},
			},
		},
		&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		nil,
	)
	assert.NoError(s.t, err)

	// Through Details rather than GetPerformerData: EditID is json:"-", so the
	// payload comes back without it and everything keyed on the edit -- images,
	// urls, aliases, this -- resolves to nothing. Details is where it is put
	// back, so going through it is what proves the field is reachable.
	details, err := s.resolver.Edit().Details(s.ctx, edit)
	assert.NoError(s.t, err)
	performerEdit, ok := details.(*models.PerformerEdit)
	if !assert.True(s.t, ok, "expected performer edit details") {
		return
	}

	typed, err := s.resolver.PerformerEdit().TypedImages(s.ctx, performerEdit)
	assert.NoError(s.t, err)

	byImage := make(map[uuid.UUID]models.TypedImage, len(typed))
	for _, entry := range typed {
		byImage[entry.Image.ID] = entry
	}

	assert.Len(s.t, typed, 2, "the gallery the edit results in, not the changes")
	assert.NotContains(s.t, byImage, dropped.ID, "a removed image is not in the result")

	// Replaced rather than added to: an entry states the whole of what is true
	// about its image.
	if entry, ok := byImage[kept.ID]; assert.True(s.t, ok) {
		assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropFace}, entry.Types)
		if assert.NotNil(s.t, entry.Date) {
			assert.Equal(s.t, date, *entry.Date)
		}
	}
	if entry, ok := byImage[added.ID]; assert.True(s.t, ok) {
		assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait}, entry.Types)
		assert.Nil(s.t, entry.Date)
	}
}

func TestTypedImagesAreTheResultingGallery(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testTypedImagesAreTheResultingGallery()
}

// The edit path grandfathers the same way the direct one does, and for the same
// reason: an edit restates the labels an image already has.
func (s *performerEditImageTypeTestRunner) testEditKeepsDisabledTypeAlreadyAssigned() {
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

	// Restating the labels alone is no change at all, so the case that matters
	// is an edit to something else that carries them along, the way the form
	// submits.
	renamed := s.generatePerformerName()
	s.applyPerformerEdit(performerID, &models.PerformerEditDetailsInput{
		Name:     &renamed,
		ImageIds: []uuid.UUID{imageID},
		ImageTypes: []models.ImageAssignmentInput{
			{ImageID: imageID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}},
		},
	})

	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
		s.typesOf(performerID)[imageID])

	// Still per image: an edit cannot use the grandfathered label to put the
	// switched-off type somewhere it has never been. The resolver is called
	// directly because createTestPerformerEdit asserts the edit was created.
	_, err = s.resolver.Mutation().PerformerEdit(s.ctx, models.PerformerEditInput{
		Edit: &models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
		Details: &models.PerformerEditDetailsInput{
			ImageIds: []uuid.UUID{imageID, fresh.ID},
			ImageTypes: []models.ImageAssignmentInput{
				{ImageID: imageID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}},
				{ImageID: fresh.ID, Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid}},
			},
		},
	})
	assert.ErrorContains(s.t, err, "not enabled on this instance")
}

func TestEditKeepsDisabledTypeAlreadyAssigned(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testEditKeepsDisabledTypeAlreadyAssigned()
}

// Merging is what makes two individually valid edits produce an invalid image.
// Each is resolved against current state at apply time, so E1 adding VIEW_FRONT
// and E2 adding VIEW_SIDE both pass validation when they are created -- against
// a clean image -- and contradict each other only once both have landed. POSE
// is exclusive, and nothing in the schema enforces that.
func (s *performerEditImageTypeTestRunner) testConcurrentLabellingCannotContradict() {
	performerID, imageID := s.createLabelledPerformer()

	submit := func(imageType models.ImageTypeEnum) uuid.UUID {
		s.t.Helper()
		edit, err := s.createTestPerformerEdit(
			models.OperationEnumModify,
			&models.PerformerEditDetailsInput{
				ImageIds: []uuid.UUID{imageID},
				ImageTypes: []models.ImageAssignmentInput{
					{ImageID: imageID, Types: []models.ImageTypeEnum{imageType}},
				},
			},
			&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
			nil,
		)
		assert.NoError(s.t, err)
		return edit.ID
	}

	// Both submitted against the same clean image, before either is approved.
	front := submit(models.ImageTypeEnumViewFront)
	side := submit(models.ImageTypeEnumViewSide)

	applied, err := s.approveEdit(front)
	assert.NoError(s.t, err)
	assert.Equal(s.t, models.VoteStatusEnumImmediateAccepted.String(), applied.Status)

	// The second now merges into a state its author never saw. A refused apply
	// is recorded on the edit rather than returned: the vote already happened,
	// and the reviewer needs to see why it did not land.
	refused, err := s.approveEdit(side)
	assert.NoError(s.t, err)
	assert.Equal(s.t, models.VoteStatusEnumFailed.String(), refused.Status)

	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumViewFront},
		s.typesOf(performerID)[imageID], "the refused edit must not have applied")
}

func TestConcurrentLabellingCannotContradict(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testConcurrentLabellingCannotContradict()
}

// The same again across groups rather than within one. Exclusivity and
// conflicts_with are separate rules reached by separate code, and only the
// second can say that a face crop cannot be topless.
func (s *performerEditImageTypeTestRunner) testConcurrentLabellingCannotConflict() {
	performerID, imageID := s.createLabelledPerformer()

	submit := func(imageType models.ImageTypeEnum) uuid.UUID {
		s.t.Helper()
		edit, err := s.createTestPerformerEdit(
			models.OperationEnumModify,
			&models.PerformerEditDetailsInput{
				ImageIds: []uuid.UUID{imageID},
				ImageTypes: []models.ImageAssignmentInput{
					{ImageID: imageID, Types: []models.ImageTypeEnum{imageType}},
				},
			},
			&models.EditInput{Operation: models.OperationEnumModify, ID: &performerID},
			nil,
		)
		assert.NoError(s.t, err)
		return edit.ID
	}

	face := submit(models.ImageTypeEnumCropFace)
	topless := submit(models.ImageTypeEnumDressTopless)

	_, err := s.approveEdit(face)
	assert.NoError(s.t, err)

	refused, err := s.approveEdit(topless)
	assert.NoError(s.t, err)
	assert.Equal(s.t, models.VoteStatusEnumFailed.String(), refused.Status)

	assert.Equal(s.t, []models.ImageTypeEnum{models.ImageTypeEnumCropFace},
		s.typesOf(performerID)[imageID])
}

func TestConcurrentLabellingCannotConflict(t *testing.T) {
	s := createPerformerEditImageTypeTestRunner(t)
	s.testConcurrentLabellingCannotConflict()
}
