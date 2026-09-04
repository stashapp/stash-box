package models

import (
	"github.com/gofrs/uuid"
)

type Image struct {
	ID        uuid.UUID `json:"id"`
	RemoteURL *string   `json:"url"`
	Checksum  string    `json:"checksum"`
	Width     int       `json:"width"`
	Height    int       `json:"height"`
	// Date is a plain column on images, populated like Width/Height. Types is
	// deliberately not a field here: it comes from a join, resolved lazily via
	// a dataloader (imageResolver.Types), the same pattern used for other
	// relational fields like Performer.Images.
	Date *string `json:"date"`
	// The uncropped image this was cropped from, if one was retained. Nil for
	// most rows. Resolved to a full Image lazily via a dataloader
	// (imageResolver.OriginalImage), the same pattern Types uses.
	OriginalImageID uuid.NullUUID `json:"original_image_id"`
}
