package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type Image struct {
	ID            uuid.UUID     `json:"id"`
	Checksum      string        `json:"checksum"`
	Width         int           `json:"width"`
	Height        int           `json:"height"`
	Date          *string       `json:"date"`
	Organized     bool          `json:"organized"`
	CategorizedAt *time.Time    `json:"categorized_at"`
	CategorizedBy uuid.NullUUID `json:"categorized_by"`
}

type UnorganizedImagesQuery struct {
	Filter UnorganizedImagesQueryInput `json:"filter"`
}
