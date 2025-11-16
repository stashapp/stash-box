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
}
