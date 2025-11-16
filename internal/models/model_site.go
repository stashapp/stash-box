package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type Site struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	URL         *string   `json:"url"`
	Regex       *string   `json:"regex"`
	ValidTypes  []string  `json:"valid_types"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
