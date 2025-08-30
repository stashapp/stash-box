package models

import "github.com/gofrs/uuid"

type URL struct {
	URL    string    `json:"url"`
	SiteID uuid.UUID `json:"SiteID"`
}
