package models

import "uuid"

type URL struct {
	URL    string    `json:"url"`
	SiteID uuid.UUID `json:"site_id"`
}
