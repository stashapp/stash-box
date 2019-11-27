package models

import (
	"database/sql"
	"strconv"

	"github.com/stashapp/stashdb/pkg/database"
)

const (
	studioTable   = "studios"
	studioJoinKey = "studio_id"
)

var (
	studioDBTable = database.NewTable(studioTable, func() interface{} {
		return &Studio{}
	})

	studioUrlTable = database.NewTableJoin(studioTable, "studio_urls", studioJoinKey, func() interface{} {
		return &StudioUrl{}
	})
)

type Studio struct {
	ID             int64           `db:"id" json:"id"`
	Name           string          `db:"name" json:"name"`
	Image          []byte          `db:"image" json:"image"`
	ParentStudioID sql.NullInt64   `db:"parent_studio_id,omitempty" json:"parent_studio_id"`
	CreatedAt      SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt      SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

func (Studio) GetTable() database.Table {
	return studioDBTable
}

func (p Studio) GetID() int64 {
	return p.ID
}

type Studios []*Studio

func (p Studios) Each(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *Studios) Add(o interface{}) {
	*p = append(*p, o.(*Studio))
}

type StudioUrl struct {
	StudioID int64  `db:"studio_id" json:"studio_id"`
	URL      string `db:"url" json:"url"`
	Type     string `db:"type" json:"type"`
}

func (p *StudioUrl) ToURL() URL {
	return URL{
		URL:  p.URL,
		Type: p.Type,
	}
}

type StudioUrls []StudioUrl

func (p StudioUrls) Each(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *StudioUrls) Add(o interface{}) {
	*p = append(*p, o.(StudioUrl))
}

func CreateStudioUrls(studioId int64, urls []*URLInput) []StudioUrl {
	var ret []StudioUrl

	for _, urlInput := range urls {
		ret = append(ret, StudioUrl{
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
