package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/image/croptemplate"
	"github.com/stashapp/stash-box/internal/models"
)

type imageTypeResolver struct{ *Resolver }

// CropTemplate is the frame to crop to for a type, read from the Photoshop
// template it ships with
//
// A field resolver rather than something carried on the model, so the template
// is parsed only when a client asks for the frame. Most types have no template
// at all - nothing about a pose or a state of dress says anything about the
// shape of the picture
func (r *imageTypeResolver) CropTemplate(ctx context.Context, obj *models.ImageType) (*models.CropTemplate, error) {
	template, ok := r.services.CropTemplates().Template(string(obj.Key))
	if !ok {
		return nil, nil
	}

	guides := make([]models.CropGuide, 0, len(template.Guides))
	for _, guide := range template.Guides {
		guides = append(guides, models.CropGuide{
			Axis:     models.CropGuideAxisEnum(guide.Axis),
			Position: guide.Position,
			Role:     cropGuideRole(guide.Role),
			Label:    cropGuideLabel(guide.Label),
			Pivot:    guide.Pivot,
		})
	}

	return &models.CropTemplate{
		AspectRatio: template.AspectRatio(),
		Guides:      guides,
	}, nil
}

// cropGuideRole maps an unroled guide to null rather than to an empty string a
// client would have to know to ignore. A template need not say how closely each
// of its lines is meant to be followed
//
// Empty is the only value needing translation: croptemplate normalises a role
// it does not recognise to empty when it reads the template, so anything else
// arriving here is already one of the known ones
func cropGuideRole(role croptemplate.Role) *models.CropGuideRoleEnum {
	if role == "" {
		return nil
	}
	out := models.CropGuideRoleEnum(role)
	return &out
}

func cropGuideLabel(label string) *string {
	if label == "" {
		return nil
	}
	return &label
}
