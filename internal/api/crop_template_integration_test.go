//go:build integration

package api_test

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/image/croptemplate"
	"github.com/stashapp/stash-box/internal/models"
)

func TestOnlyCropTypesResolveATemplateAndItMatchesTheShippedFile(t *testing.T) {
	s := createImageTypeTestRunner(t)

	for _, key := range models.AllImageTypeEnum {
		t.Run(string(key), func(t *testing.T) {
			resolved, err := s.resolver.ImageType().CropTemplate(s.ctx, &models.ImageType{Key: key})
			require.NoError(t, err)

			template, ok := croptemplate.Lookup(string(key))
			assert.Equal(t, strings.HasPrefix(string(key), "CROP_"), ok)
			if !ok {
				assert.Nil(t, resolved)
				return
			}

			guides := make([]models.CropGuide, 0, len(template.Guides))
			for _, guide := range template.Guides {
				guides = append(guides, models.CropGuide{
					Axis:     models.CropGuideAxisEnum(guide.Axis),
					Position: guide.Position,
					Role:     models.CropGuideRoleEnum(guide.Role),
					Label:    guide.Label,
				})
			}
			assert.Equal(t, &models.CropTemplate{AspectRatio: template.AspectRatio(), Guides: guides}, resolved)
			assert.Equal(t, key == models.ImageTypeEnumCropWide, resolved.AspectRatio > 1, "only Wide is landscape")
		})
	}
}
