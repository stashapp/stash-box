package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/image/croptemplate"
	"github.com/stashapp/stash-box/internal/models"
)

type imageTypeResolver struct{ *Resolver }

// CropTemplate is the frame to crop to for a type; only crop types have one
func (r *imageTypeResolver) CropTemplate(ctx context.Context, obj *models.ImageType) (*models.CropTemplate, error) {
	template, ok := croptemplate.Lookup(string(obj.Key))
	if !ok {
		return nil, nil
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

	return &models.CropTemplate{AspectRatio: template.AspectRatio(), Guides: guides}, nil
}
