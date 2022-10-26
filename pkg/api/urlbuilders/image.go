package urlbuilders

import "github.com/gofrs/uuid"

type ImageURLBuilder struct {
	BaseURL string
	ID      uuid.UUID
}

func NewImageURLBuilder(baseURL string, id uuid.UUID) ImageURLBuilder {
	return ImageURLBuilder{
		BaseURL: baseURL,
		ID:      id,
	}
}

func (b ImageURLBuilder) GetImageURL() string {
	return b.BaseURL + "/image/" + b.ID.String()
}
