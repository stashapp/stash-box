//go:build integration

package api_test

import (
	"bytes"
	"io"
	"testing"

	"github.com/99designs/gqlgen/graphql"
	"github.com/gofrs/uuid"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/storage"
	"github.com/stretchr/testify/assert"
)

// Starts at the origin to keep pixel (0,0), the one createTestImage varies
var testCrop = &models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 0.5}

var leftHalf = &models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 1}

func TestImageRecropCreatesNewRow(t *testing.T) {
	s := asAdmin(t)
	source, err := s.createTestImage(400, 600)
	assert.NoError(t, err)

	recropped, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: source.ID,
		Crop:    testCrop,
	})
	assert.NoError(t, err)
	assert.NotEqual(t, source.ID, recropped.ID, "recrop must produce a new row")
	assert.Equal(t, source.ID, recropped.OriginalImageID.UUID,
		"a source with no retained original of its own becomes the original")

	unused, err := dbtest.Factory().Image().IsUnused(s.ctx, source.ID)
	assert.NoError(t, err)
	assert.False(t, unused, "the source now backs the recrop as its retained original")
}

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
		Crop:    testCrop,
	})
	assert.NoError(t, err)

	assert.Equal(t, date, *recropped.Date)

	s.newRequest()
	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: recropped.ID})
	assert.NoError(t, err)
	assert.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumCropFace}, types)
}

func TestImageRecropLabelsAndCropsAtomicallyAtEditLevel(t *testing.T) {
	edit := asEdit(t)
	fresh, err := edit.createTestImage(400, 600)
	assert.NoError(t, err)

	date := "2021-05"
	recropped, err := edit.resolver.Mutation().ImageRecrop(edit.ctx, models.ImageRecropInput{
		ImageID: fresh.ID,
		Crop:    testCrop,
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

func TestImageRecropFreelyRelabelsUnorganizedImages(t *testing.T) {
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
		Crop:    testCrop,
		Types:   []models.ImageTypeEnum{models.ImageTypeEnumCropFace},
	})
	assert.NoError(t, err)
}

func TestImageRecropOfOrganizedSource(t *testing.T) {
	admin := asAdmin(t)
	organized, err := admin.createTestImage(400, 600)
	assert.NoError(t, err)
	_, err = admin.resolver.Mutation().ImageUpdate(admin.ctx, models.ImageUpdateInput{
		ID:    organized.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumCropBust},
	})
	assert.NoError(t, err)
	_, err = admin.resolver.Mutation().ImageSetOrganized(admin.ctx, models.ImageSetOrganizedInput{
		ID:        organized.ID,
		Organized: true,
	})
	assert.NoError(t, err)

	edit := asEdit(t)
	recropped, err := edit.resolver.Mutation().ImageRecrop(edit.ctx, models.ImageRecropInput{
		ImageID: organized.ID,
		Crop:    testCrop,
	})
	assert.NoError(t, err)
	assert.False(t, recropped.Organized, "the derived row is new work awaiting its own sign-off")
	assert.NotNil(t, recropped.CategorizedAt, "a categorized derived row should carry a categorized_at")

	source, err := dbtest.Factory().Image().Find(admin.ctx, organized.ID)
	assert.NoError(t, err)
	assert.True(t, source.Organized, "the source keeps its mark")
}

func TestImageRecropUnknownSource(t *testing.T) {
	s := asAdmin(t)

	stranger, err := uuid.NewV7()
	assert.NoError(t, err)

	_, err = s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: stranger,
		Crop:    testCrop,
	})
	assert.ErrorContains(t, err, "image not found")
}

// Proved with pixels: a re-encode keeps the dimensions
func TestImageRecropUsesTheRetainedOriginal(t *testing.T) {
	s := asAdmin(t)

	cropped, err := s.uploadCropped(400, 300, leftHalf)
	if !assert.NoError(t, err) {
		return
	}
	assert.Equal(t, 200, cropped.Width)
	assert.True(t, cropped.OriginalImageID.Valid, "an initial crop must retain the uncropped upload")

	// The right-most quarter is columns 300-399 of the original but 150-199 of the stored crop
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

func TestImageRecropChainsStayFlat(t *testing.T) {
	s := asAdmin(t)

	cropped, err := s.uploadCropped(400, 300, leftHalf)
	if !assert.NoError(t, err) {
		return
	}
	assert.True(t, cropped.OriginalImageID.Valid)
	trueOriginalID := cropped.OriginalImageID.UUID

	firstRecrop, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: cropped.ID,
		Crop:    testCrop,
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

func TestImageCreateChainsStayFlatThroughDedupe(t *testing.T) {
	s := asAdmin(t)

	cropped, err := s.uploadCropped(400, 300, leftHalf)
	if !assert.NoError(t, err) {
		return
	}
	if !assert.True(t, cropped.OriginalImageID.Valid) {
		return
	}
	rootID := cropped.OriginalImageID.UUID

	reader, _, err := storage.Image().ReadFile(*cropped)
	if !assert.NoError(t, err) {
		return
	}
	defer reader.Close()
	file, err := io.ReadAll(reader)
	if !assert.NoError(t, err) {
		return
	}

	again, err := s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
		File: &graphql.Upload{
			File:     bytes.NewReader(file),
			Size:     int64(len(file)),
			Filename: "again.png",
		},
		Crop: testCrop,
	})
	if !assert.NoError(t, err) {
		return
	}
	if assert.True(t, again.OriginalImageID.Valid) {
		assert.Equal(t, rootID, again.OriginalImageID.UUID,
			"an upload that dedupes onto a crop should link to that crop's original")
	}
}

func TestImageRecropOriginalStaysUsedUntilItsDerivedRowIsGone(t *testing.T) {
	s := asAdmin(t)
	images := dbtest.Factory().Image()

	cropped, err := s.uploadCropped(300, 200, leftHalf)
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

func TestImageRecropDedupeLeavesTheExistingRowAlone(t *testing.T) {
	s := asAdmin(t)
	source, err := s.createTestImage(400, 600)
	assert.NoError(t, err)

	first, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: source.ID,
		Crop:    testCrop,
		Types:   []models.ImageTypeEnum{models.ImageTypeEnumCropBust},
	})
	assert.NoError(t, err)
	audits := len(auditsFor(t, first.ID, "CATEGORIZE"))

	again, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: source.ID,
		Crop:    testCrop,
		Types:   []models.ImageTypeEnum{models.ImageTypeEnumCropFace},
	})
	assert.NoError(t, err)
	assert.Equal(t, first.ID, again.ID, "identical bytes should resolve to the existing row")

	s.newRequest()
	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: first.ID})
	assert.NoError(t, err)
	assert.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumCropBust}, types,
		"the deduped row keeps its own categorization")
	assert.Len(t, auditsFor(t, first.ID, "CATEGORIZE"), audits,
		"no audit row for label assignments that never happened")

	// An identity crop resolves to the target's own bytes
	identity, err := s.resolver.Mutation().ImageRecrop(s.ctx, models.ImageRecropInput{
		ImageID: source.ID,
		Crop:    &models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1},
		Types:   []models.ImageTypeEnum{models.ImageTypeEnumCropFace},
	})
	assert.NoError(t, err)
	assert.Equal(t, source.ID, identity.ID)
	assert.Empty(t, auditsFor(t, source.ID, "CATEGORIZE"))
}
