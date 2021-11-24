package urlbuilders

type ImageURLBuilder struct {
	BaseURL  string
	Checksum string
}

func NewImageURLBuilder(baseURL string, checksum string) ImageURLBuilder {
	return ImageURLBuilder{
		BaseURL:  baseURL,
		Checksum: checksum,
	}
}

func (b ImageURLBuilder) GetImageURL() string {
	return b.BaseURL + "/image/" + b.Checksum
}
