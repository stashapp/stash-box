//go:build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/internal/image/croptemplate"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

// The frame is read through the vocabulary query, which is the call the edit
// form already makes, so the cropping tool costs no extra round trip

func (s *imageTypeTestRunner) cropTemplateFor(key models.ImageTypeEnum) *models.CropTemplate {
	s.t.Helper()

	for _, group := range s.readGroups() {
		for _, imageType := range group.Types {
			if imageType.Key != key {
				continue
			}
			template, err := s.resolver.ImageType().CropTemplate(s.ctx, &imageType)
			assert.NoError(s.t, err)
			return template
		}
	}

	s.t.Fatalf("no image type %s in the vocabulary", key)
	return nil
}

func TestCropTypesCarryATemplate(t *testing.T) {
	s := createImageTypeTestRunner(t)

	for _, key := range []models.ImageTypeEnum{
		models.ImageTypeEnumCropFace,
		models.ImageTypeEnumCropBust,
		models.ImageTypeEnumCropTorso,
		models.ImageTypeEnumCropThreeQuarter,
		models.ImageTypeEnumCropThreeQuarterPlus,
		models.ImageTypeEnumCropFullBody,
		models.ImageTypeEnumCropWide,
	} {
		t.Run(string(key), func(t *testing.T) {
			template := s.cropTemplateFor(key)
			if !assert.NotNil(t, template, "no crop template") {
				return
			}

			assert.Greater(t, template.AspectRatio, 0.0, "unusable aspect ratio")
			assert.NotEmpty(t, template.Guides, "a template with no guides cannot draw an overlay")

			for i, guide := range template.Guides {
				assert.Contains(t,
					[]models.CropGuideAxisEnum{models.CropGuideAxisEnumX, models.CropGuideAxisEnumY},
					guide.Axis, "guide %d has an unknown axis", i)
				// A line outside the canvas would render outside the crop
				// frame where it means nothing
				assert.GreaterOrEqual(t, guide.Position, 0.0, "guide %d is off the canvas", i)
				assert.LessOrEqual(t, guide.Position, 1.0, "guide %d is off the canvas", i)
			}
		})
	}
}

// Everything else in the taxonomy describes the subject rather than the frame,
// and a pose or a state of dress has nothing to say about the shape of the
// picture. Offering those a crop frame would be offering nonsense
func TestNonCropTypesHaveNoTemplate(t *testing.T) {
	s := createImageTypeTestRunner(t)

	for _, key := range []models.ImageTypeEnum{
		models.ImageTypeEnumShotPortrait,
		models.ImageTypeEnumViewFront,
		models.ImageTypeEnumPostureStanding,
		models.ImageTypeEnumDressNonNude,
	} {
		t.Run(string(key), func(t *testing.T) {
			assert.Nil(t, s.cropTemplateFor(key), "unexpected crop template")
		})
	}
}

func TestWideIsLandscapeAndTheRestArePortrait(t *testing.T) {
	s := createImageTypeTestRunner(t)

	wide := s.cropTemplateFor(models.ImageTypeEnumCropWide)
	if assert.NotNil(t, wide) {
		assert.Greater(t, wide.AspectRatio, 1.0, "Wide should be a landscape frame")
	}

	for _, key := range []models.ImageTypeEnum{
		models.ImageTypeEnumCropFace,
		models.ImageTypeEnumCropFullBody,
	} {
		template := s.cropTemplateFor(key)
		if assert.NotNil(t, template, key) {
			assert.Less(t, template.AspectRatio, 1.0, "%s should be a portrait frame", key)
		}
	}
}

// Labels are what make the overlay teach rather than decorate, so at least one
// guide should arrive named. Which one, and what it says, is the template's business
func TestCropTemplateGuidesAreLabelled(t *testing.T) {
	s := createImageTypeTestRunner(t)

	template := s.cropTemplateFor(models.ImageTypeEnumCropFace)
	if !assert.NotNil(t, template) {
		return
	}

	var labelled, roled int
	for _, guide := range template.Guides {
		if guide.Label != nil && *guide.Label != "" {
			labelled++
		}
		if guide.Role != nil {
			assert.True(t, guide.Role.IsValid(), "role %q is not one of the known values", *guide.Role)
			roled++
		}
	}

	assert.NotZero(t, labelled, "no guide carries a label")
	assert.NotZero(t, roled, "no guide says how closely it should be followed")
}

func TestCropTemplateMatchesTheLoadedFile(t *testing.T) {
	s := createImageTypeTestRunner(t)

	loader := croptemplate.NewLoader()

	for _, key := range []models.ImageTypeEnum{
		models.ImageTypeEnumCropFace,
		models.ImageTypeEnumCropWide,
	} {
		t.Run(string(key), func(t *testing.T) {
			loaded, ok := loader.Template(string(key))
			assert.True(t, ok, "the loader has no template")

			resolved := s.cropTemplateFor(key)
			if !assert.NotNil(t, resolved) {
				return
			}

			assert.Equal(t, loaded.AspectRatio(), resolved.AspectRatio)
			if !assert.Len(t, resolved.Guides, len(loaded.Guides)) {
				return
			}

			for i, want := range loaded.Guides {
				got := resolved.Guides[i]
				assert.EqualValues(t, want.Axis, got.Axis, "guide %d axis", i)
				assert.Equal(t, want.Position, got.Position, "guide %d position", i)

				if want.Label == "" {
					assert.Nil(t, got.Label, "guide %d label", i)
				} else if assert.NotNil(t, got.Label, "guide %d label", i) {
					assert.Equal(t, want.Label, *got.Label, "guide %d label", i)
				}

				if want.Role == "" {
					assert.Nil(t, got.Role, "guide %d role", i)
				} else if assert.NotNil(t, got.Role, "guide %d role", i) {
					assert.EqualValues(t, want.Role, *got.Role, "guide %d role", i)
				}
			}
		})
	}
}
