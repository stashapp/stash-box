package urlbuilders

import "github.com/gofrs/uuid"

type ImageURLBuilder struct {
	BaseURL string
	ID      uuid.UUID
	IsSVG   bool
}

func NewImageURLBuilder(baseURL string, id uuid.UUID, isSVG bool) ImageURLBuilder {
	return ImageURLBuilder{
		BaseURL: baseURL,
		ID:      id,
		IsSVG:   isSVG,
	}
}

func (b ImageURLBuilder) GetImageURL() string {
	if b.IsSVG {
		// required for correct Content-Type header
		return b.BaseURL + "/image/" + b.ID.String() + ".svg"
	} else {
		return b.BaseURL + "/image/" + b.ID.String()
	}
}
