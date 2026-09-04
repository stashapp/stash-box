//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

// Starts at the origin, unlike an arbitrary offset crop, so it keeps pixel
// (0,0) - the one createTestImage varies to make each test image's bytes
// distinct. Cropping it away would make every test's recrop collide on
// checksum with every other's, regardless of source.
func testCrop() *models.ImageCropInput {
	return &models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 0.5}
}

// Re-cropping always produces a new row rather than mutating the source: a
// stored image may in principle be shared by more than one entity via
// checksum deduplication, so re-cropping never mutates it in place. The
// source itself becomes the new row's retained original -- the first time
// anything is cropped from it -- so it is not unused even though nothing
// links to it directly anymore.
func TestImageRecropCreatesNewRow(t *testing.T) {
	s := asAdmin(t)
	source, err := s.createTestImage(400, 600)
	assert.NoError(t, err)

	recropped, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: source.ID,
		Crop:    testCrop(),
	})
	assert.NoError(t, err)
	assert.NotEqual(t, source.ID, recropped.ID, "recrop must produce a new row")
	assert.Equal(t, source.ID, recropped.OriginalImageID.UUID,
		"a source with no retained original of its own becomes the original")

	// The source is untouched and still findable, but no longer unused: the
	// new row now depends on it for any further recrop.
	unused, err := dbtest.Factory().Image().IsUnused(s.ctx, source.ID)
	assert.NoError(t, err)
	assert.False(t, unused, "the source now backs the recrop as its retained original")
}

// The new row starts out carrying the source image's current labels and
// date, since a re-crop is a judgement about the same photograph.
func TestImageRecropCarriesForwardLabelsAndDate(t *testing.T) {
	s := asAdmin(t)
	source, err := s.createTestImage(400, 600)
	assert.NoError(t, err)

	date := "2021-05"
	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    source.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumCropFace},
		Date:  &date,
	})
	assert.NoError(t, err)

	recropped, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: source.ID,
		Crop:    testCrop(),
	})
	assert.NoError(t, err)

	assert.Equal(t, date, *recropped.Date)

	s.newRequest()
	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: recropped.ID})
	assert.NoError(t, err)
	assert.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumCropFace}, types)
}

// Labelling a never-before-categorized image and cropping it to match, in
// the same sitting, is one atomic EDIT-level action -- the labels ride along
// on the same call as the crop, rather than being committed by a separate
// Update first. A separate-Update-first sequence would make the source
// already-categorized by the time Recrop's own gate runs, tripping the
// MODERATE check in TestImageRecropRoleGating for what should still be a
// single first-time categorization.
func TestImageRecropLabelsAndCropsAtomicallyAtEditLevel(t *testing.T) {
	edit := asEdit(t)
	fresh, err := edit.createTestImage(400, 600)
	assert.NoError(t, err)

	date := "2021-05"
	recropped, err := edit.resolver.Mutation().ImageRecrop(edit.ctx, models.ImageRecropInput{
		ImageID: fresh.ID,
		Crop:    testCrop(),
		Types:   []models.ImageTypeEnum{models.ImageTypeEnumCropFace},
		Date:    &date,
	})
	assert.NoError(t, err, "EDIT should be able to label and crop a never-before-categorized image in one action")
	assert.Equal(t, date, *recropped.Date)

	edit.newRequest()
	types, err := edit.resolver.Image().Types(edit.ctx, &models.Image{ID: recropped.ID})
	assert.NoError(t, err)
	assert.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumCropFace}, types)
}

// Distinct from the atomic first-time case above: submitting new types/date
// for an image that already carries them (regardless of whether the source
// itself already had them, or this same call is what just gave them to it)
// is still gated on the source's state as it stood *before* this call --
// changing an already-categorized image's labels via Recrop needs MODERATE
// same as changing them via Update would.
func TestImageRecropChangingAnAlreadyLabelledImageStillNeedsModerate(t *testing.T) {
	admin := asAdmin(t)
	labelled, err := admin.createTestImage(400, 600)
	assert.NoError(t, err)
	_, err = admin.resolver.Mutation().ImageUpdate(admin.ctx, models.ImageUpdateInput{
		ID:    labelled.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumCropBust},
	})
	assert.NoError(t, err)

	edit := asEdit(t)
	_, err = edit.resolver.Mutation().ImageRecrop(edit.ctx, models.ImageRecropInput{
		ImageID: labelled.ID,
		Crop:    testCrop(),
		Types:   []models.ImageTypeEnum{models.ImageTypeEnumCropFace},
	})
	assert.ErrorContains(t, err, "not authorized")
}

// Re-cropping an uncategorized image stays at EDIT; re-cropping one that
// already carries labels or a date requires MODERATE.
func TestImageRecropRoleGating(t *testing.T) {
	admin := asAdmin(t)
	fresh, err := admin.createTestImage(400, 600)
	assert.NoError(t, err)

	edit := asEdit(t)
	_, err = edit.resolver.Mutation().ImageRecrop(edit.ctx, models.ImageRecropInput{
		ImageID: fresh.ID,
		Crop:    testCrop(),
	})
	assert.NoError(t, err, "EDIT should be able to recrop an uncategorized image")

	labelled, err := admin.createTestImage(400, 600)
	assert.NoError(t, err)
	_, err = admin.resolver.Mutation().ImageUpdate(admin.ctx, models.ImageUpdateInput{
		ID:    labelled.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumCropBust},
	})
	assert.NoError(t, err)

	_, err = edit.resolver.Mutation().ImageRecrop(edit.ctx, models.ImageRecropInput{
		ImageID: labelled.ID,
		Crop:    testCrop(),
	})
	assert.ErrorContains(t, err, "not authorized")

	moderate := asModerate(t)
	_, err = moderate.resolver.Mutation().ImageRecrop(moderate.ctx, models.ImageRecropInput{
		ImageID: labelled.ID,
		Crop:    testCrop(),
	})
	assert.NoError(t, err, "MODERATE should be able to recrop an already-categorized image")
}

func TestImageRecropUnknownSource(t *testing.T) {
	s := asAdmin(t)

	stranger, err := uuid.NewV7()
	assert.NoError(t, err)

	_, err = s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: stranger,
		Crop:    testCrop(),
	})
	assert.ErrorContains(t, err, "image not found")
}

// An initial crop retains the uncropped upload, and Recrop must read from
// that rather than from the already-narrower stored bytes -- otherwise a
// recrop can never recover anything the first crop cut away.
//
// Proved with pixels, not just dimensions: a re-encode preserves size
// perfectly well, so only sampling can tell whether the frame came from the
// wide original or the narrow stored crop.
func TestImageRecropUsesTheRetainedOriginal(t *testing.T) {
	s := asAdmin(t)

	// Keeps the left half: a 400-wide source becomes a 200-wide stored image
	// covering source columns 0-199.
	cropped, err := s.uploadCropped(400, 300, &models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 1})
	if !assert.NoError(t, err) {
		return
	}
	assert.Equal(t, 200, cropped.Width)
	assert.True(t, cropped.OriginalImageID.Valid, "an initial crop must retain the uncropped upload")

	// The right-most quarter of whichever image this lands against. Against
	// the true 400-wide original that is source columns 300-399; against the
	// already-cropped 200-wide stored bytes it would be columns 150-199 --
	// different pixels entirely, so which one comes back proves which bytes
	// Recrop actually read.
	recropped, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: cropped.ID,
		Crop:    &models.ImageCropInput{X: 0.75, Y: 0, Width: 0.25, Height: 1},
	})
	if !assert.NoError(t, err) {
		return
	}

	middle := s.storedPixel(recropped, 0.5, 0.5)
	sourceX := int(0.75*400) + recropped.Width/2
	assert.Equal(t, uint8(sourceX%256), middle.R,
		"the recrop should read the retained original, not the already-cropped stored bytes")
}

// A recrop of a recrop must still point at the one true original, not at the
// intermediate crop it was made from -- chains stay flat rather than nesting,
// so no recrop is ever more than one step removed from the best material
// available.
func TestImageRecropChainsStayFlat(t *testing.T) {
	s := asAdmin(t)

	cropped, err := s.uploadCropped(400, 300, &models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 1})
	if !assert.NoError(t, err) {
		return
	}
	assert.True(t, cropped.OriginalImageID.Valid)
	trueOriginalID := cropped.OriginalImageID.UUID

	firstRecrop, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: cropped.ID,
		Crop:    testCrop(),
	})
	if !assert.NoError(t, err) {
		return
	}
	assert.True(t, firstRecrop.OriginalImageID.Valid)
	assert.Equal(t, trueOriginalID, firstRecrop.OriginalImageID.UUID,
		"a recrop of a crop should point at the true original, not the crop it was made from")

	secondRecrop, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: firstRecrop.ID,
		Crop:    &models.ImageCropInput{X: 0.5, Y: 0.5, Width: 0.5, Height: 0.5},
	})
	if !assert.NoError(t, err) {
		return
	}
	assert.Equal(t, trueOriginalID, secondRecrop.OriginalImageID.UUID,
		"a chain of recrops should stay flat against the one true original")
}

// A retained original is not "unused" while a derived image still exists to
// read it from, even though the original itself carries no gallery
// membership -- but once that derived image is gone, nothing needs it
// anymore and the existing garbage-collection query must say so.
func TestImageRecropOriginalStaysUsedUntilItsDerivedRowIsGone(t *testing.T) {
	s := asAdmin(t)
	images := dbtest.Factory().Image()

	cropped, err := s.uploadCropped(300, 200, &models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 1})
	if !assert.NoError(t, err) {
		return
	}
	assert.True(t, cropped.OriginalImageID.Valid)
	originalID := cropped.OriginalImageID.UUID

	unused, err := images.IsUnused(s.ctx, originalID)
	assert.NoError(t, err)
	assert.False(t, unused, "the original still backs a live derived image")

	assert.NoError(t, images.Destroy(s.ctx, cropped.ID))

	unused, err = images.IsUnused(s.ctx, originalID)
	assert.NoError(t, err)
	assert.True(t, unused, "nothing derives from the original anymore")
}
