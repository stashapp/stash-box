//go:build integration

package api_test

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"testing"

	"github.com/99designs/gqlgen/graphql"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

// EDIT role suffices to label an image that carries nothing yet.
func TestImageUpdateEditRoleSucceedsOnFreshImage(t *testing.T) {
	s := asEdit(t)
	img, err := s.createTestImage(400, 600)
	assert.NoError(t, err)

	_, err = s.resolver.Mutation().ImageUpdate(s.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
	})
	assert.NoError(t, err)
}

// Changing an image that already carries a label requires MODERATE; EDIT
// alone is refused.
func TestImageUpdateEditRoleFailsOnceCategorized(t *testing.T) {
	admin := asAdmin(t)
	img, err := admin.createTestImage(400, 600)
	assert.NoError(t, err)

	_, err = admin.resolver.Mutation().ImageUpdate(admin.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
	})
	assert.NoError(t, err)

	edit := asEdit(t)
	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.ErrorContains(t, err, "not authorized")

	moderate := asModerate(t)
	_, err = moderate.resolver.Mutation().ImageUpdate(moderate.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(t, err, "MODERATE should be able to relabel an already-categorized image")
}

// The same rule applies to a date-only image: no type labels, but a date
// already set is still established categorization.
func TestImageUpdateEditRoleFailsOnceDated(t *testing.T) {
	admin := asAdmin(t)
	img, err := admin.createTestImage(400, 600)
	assert.NoError(t, err)

	date := "2019-06"
	_, err = admin.resolver.Mutation().ImageUpdate(admin.ctx, models.ImageUpdateInput{
		ID:   img.ID,
		Date: &date,
	})
	assert.NoError(t, err)

	edit := asEdit(t)
	newDate := "2020"
	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:   img.ID,
		Date: &newDate,
	})
	assert.ErrorContains(t, err, "not authorized")
}

// Types and date are gated independently: someone who labelled an image
// earlier can still date it later at EDIT, since the date itself was never
// set before.
func TestImageUpdateEditRoleCanDateAnImageItAlreadyLabelled(t *testing.T) {
	edit := asEdit(t)
	img, err := edit.createTestImage(400, 600)
	assert.NoError(t, err)

	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
	})
	assert.NoError(t, err)

	date := "2019-06"
	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
		Date:  &date,
	})
	assert.NoError(t, err)
}

// Symmetric to the above: an image dated earlier can still take its first
// EDIT-role labels later.
func TestImageUpdateEditRoleCanLabelAnImageItAlreadyDated(t *testing.T) {
	edit := asEdit(t)
	img, err := edit.createTestImage(400, 600)
	assert.NoError(t, err)

	date := "2019-06"
	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:   img.ID,
		Date: &date,
	})
	assert.NoError(t, err)

	_, err = edit.resolver.Mutation().ImageUpdate(edit.ctx, models.ImageUpdateInput{
		ID:    img.ID,
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
		Date:  &date,
	})
	assert.NoError(t, err)
}

// A checksum match on upload means this is not actually a new image: its
// existing categorization must not be overwritten by what the new upload
// asked for.
func TestImageCreateDedupPreservesExistingCategorization(t *testing.T) {
	s := asAdmin(t)

	img := image.NewRGBA(image.Rect(0, 0, 400, 600))
	img.Set(0, 0, color.RGBA{R: 42, G: 7, A: 255})
	var buf bytes.Buffer
	assert.NoError(t, png.Encode(&buf, img))
	bytesA := buf.Bytes()

	first, err := s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
		File: &graphql.Upload{
			File:     bytes.NewReader(bytesA),
			Size:     int64(len(bytesA)),
			Filename: "dedup.png",
		},
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait},
	})
	assert.NoError(t, err)

	second, err := s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
		File: &graphql.Upload{
			File:     bytes.NewReader(bytesA),
			Size:     int64(len(bytesA)),
			Filename: "dedup-again.png",
		},
		Types: []models.ImageTypeEnum{models.ImageTypeEnumShotCandid},
	})
	assert.NoError(t, err)

	assert.Equal(t, first.ID, second.ID, "identical bytes should dedup to the same row")

	s.newRequest()
	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: first.ID})
	assert.NoError(t, err)
	assert.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumShotPortrait}, types,
		"the second upload's types must not overwrite the first's")
}

// Labelling a brand-new upload is a single action: types and date land in
// the same imageCreate call rather than needing a follow-up imageUpdate.
func TestImageCreateSetsTypesAndDateInOneCall(t *testing.T) {
	s := asAdmin(t)

	img := image.NewRGBA(image.Rect(0, 0, 400, 600))
	img.Set(0, 0, color.RGBA{B: 99, A: 255})
	var buf bytes.Buffer
	assert.NoError(t, png.Encode(&buf, img))

	date := "2022-01"
	created, err := s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
		File: &graphql.Upload{
			File:     bytes.NewReader(buf.Bytes()),
			Size:     int64(buf.Len()),
			Filename: "one-call.png",
		},
		Types: []models.ImageTypeEnum{models.ImageTypeEnumCropFace},
		Date:  &date,
	})
	assert.NoError(t, err)
	assert.Equal(t, date, *created.Date)

	s.newRequest()
	types, err := s.resolver.Image().Types(s.ctx, &models.Image{ID: created.ID})
	assert.NoError(t, err)
	assert.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumCropFace}, types)
}
