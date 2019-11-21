package models

import (
	"database/sql"
	"strconv"
)

type Studio struct {
	ID             int64           `db:"id" json:"id"`
	Name           string          `db:"name" json:"name"`
	Image          []byte          `db:"image" json:"image"`
	ParentStudioID sql.NullInt64   `db:"parent_studio_id,omitempty" json:"parent_studio_id"`
	CreatedAt      SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt      SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

type StudioUrls struct {
	StudioID int64  `db:"studio_id" json:"studio_id"`
	URL      string `db:"url" json:"url"`
	Type     string `db:"type" json:"type"`
}

func (p *StudioUrls) ToURL() URL {
	return URL{
		URL:  p.URL,
		Type: p.Type,
	}
}

func CreateStudioUrls(studioId int64, urls []*URLInput) []StudioUrls {
	var ret []StudioUrls

	for _, urlInput := range urls {
		ret = append(ret, StudioUrls{
			StudioID: studioId,
			URL:      urlInput.URL,
			Type:     urlInput.Type,
		})
	}

	return ret
}

func (p *Studio) IsEditTarget() {
}

func (p *Studio) CopyFromCreateInput(input StudioCreateInput) {
	CopyFull(p, input)

	if input.ParentID != nil {
		parentID, err := strconv.ParseInt(*input.ParentID, 10, 64)
		if err == nil {
			p.ParentStudioID = sql.NullInt64{Int64: parentID, Valid: true}
		}
	}
}

func (p *Studio) CopyFromUpdateInput(input StudioUpdateInput) {
	CopyFull(p, input)

	if input.ParentID != nil {
		parentID, err := strconv.ParseInt(*input.ParentID, 10, 64)
		if err == nil {
			p.ParentStudioID = sql.NullInt64{Int64: parentID, Valid: true}
		}
	}
}
