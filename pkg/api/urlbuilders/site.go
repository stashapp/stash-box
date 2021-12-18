package urlbuilders

import "github.com/gofrs/uuid"

type SiteIconURLBuilder struct {
	BaseURL string
	ID      uuid.UUID
}

func NewSiteIconURLBuilder(baseURL string, id uuid.UUID) SiteIconURLBuilder {
	return SiteIconURLBuilder{
		BaseURL: baseURL,
		ID:      id,
	}
}

func (b SiteIconURLBuilder) GetIconURL() string {
	return b.BaseURL + "/image/site/" + b.ID.String()
}
