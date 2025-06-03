package models

import (
	"database/sql"
	"sort"

	"github.com/gofrs/uuid"
)

type Image struct {
	ID        uuid.UUID      `db:"id" json:"id"`
	RemoteURL sql.NullString `db:"url" json:"url"`
	Checksum  string         `db:"checksum" json:"checksum"`
	Width     int            `db:"width" json:"width"`
	Height    int            `db:"height" json:"height"`
}

func (p Image) GetID() uuid.UUID {
	return p.ID
}

type Images []*Image

func (p Images) Each(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p Images) ToURLSlice() []string {
	urls := make([]string, len(p))
	for i, v := range p {
		urls[i] = v.RemoteURL.String
	}
	return urls
}

func (p Images) OrderLandscape() {
	sort.Slice(p, func(a, b int) bool {
		if p[a].Height == 0 || p[b].Height == 0 {
			return false
		}
		aspectA := p[a].Width / p[a].Height
		aspectB := p[b].Width / p[b].Height
		if aspectA > aspectB {
			return true
		} else if aspectA < aspectB {
			return false
		}
		return p[a].Width > p[b].Width
	})
}

func (p Images) OrderPortrait() {
	sort.Slice(p, func(a, b int) bool {
		if p[a].Width == 0 || p[b].Width == 0 {
			return false
		}
		aspectA := p[a].Height / p[a].Width
		aspectB := p[b].Height / p[b].Width
		if aspectA > aspectB {
			return true
		} else if aspectA < aspectB {
			return false
		}
		return p[a].Height > p[b].Height
	})
}

func (p *Images) Add(o interface{}) {
	*p = append(*p, o.(*Image))
}

func (p *Image) IsEditTarget() {
}

func (p *Image) CopyFromCreateInput(input ImageCreateInput) {
	CopyFull(p, input)
}

func (p *Image) CopyFromUpdateInput(input ImageUpdateInput) {
	CopyFull(p, input)
}
