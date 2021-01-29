package models

import (
	"database/sql"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/database"
)

const (
	imageTable   = "images"
	imageJoinKey = "image_id"
)

var (
	imageDBTable = database.NewTable(imageTable, func() interface{} {
		return &Image{}
	})
)

type Image struct {
	ID        uuid.UUID      `db:"id" json:"id"`
	RemoteURL sql.NullString `db:"url" json:"url"`
	Checksum  string         `db:"checksum" json:"checksum"`
	Width     int64          `db:"width" json:"width"`
	Height    int64          `db:"height" json:"height"`
}

func (Image) GetTable() database.Table {
	return imageDBTable
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
