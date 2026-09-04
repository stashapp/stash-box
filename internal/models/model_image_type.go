package models

import "github.com/gofrs/uuid"

// ImageTypeAssignment is one label an image carries. Used internally for
// ranking (Performer.images) and resolving Image.types; not exposed directly.
type ImageTypeAssignment struct {
	ImageID uuid.UUID     `json:"image_id"`
	Type    ImageTypeEnum `json:"type"`
}
