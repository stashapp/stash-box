package models

import "github.com/gofrs/uuid"

// ImageTypeAssignment is one label applied to one image's presence on an
// entity. It is not exposed directly; TypedImage groups these by image.
type ImageTypeAssignment struct {
	ImageID uuid.UUID     `json:"image_id"`
	Type    ImageTypeEnum `json:"type"`
}

// ImageDate is one image's date on an entity. Date is deliberately not
// omitempty: an explicit null is how an edit clears a date, and is different
// from the entry being absent, which leaves it alone.
type ImageDate struct {
	ImageID uuid.UUID `json:"image_id"`
	Date    *string   `json:"date"`
}
