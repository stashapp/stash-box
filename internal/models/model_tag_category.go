package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type TagCategory struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Group       string    `json:"group"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
