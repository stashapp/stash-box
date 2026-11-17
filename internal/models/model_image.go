package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type Image struct {
	ID            uuid.UUID     `json:"id"`
	RemoteURL     *string       `json:"url"`
	Checksum      string        `json:"checksum"`
	Width         int           `json:"width"`
	Height        int           `json:"height"`
	Date          *string       `json:"date"`
	Organized     bool          `json:"organized"`
	CategorizedAt *time.Time    `json:"categorized_at"`
	CategorizedBy uuid.NullUUID `json:"categorized_by"`
	// The uncropped image this was cropped from, if one was retained
	OriginalImageID uuid.NullUUID `json:"original_image_id"`
}

type UnorganizedImagesQuery struct {
	Filter UnorganizedImagesQueryInput `json:"filter"`
}
