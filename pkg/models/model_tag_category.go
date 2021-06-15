package models

import (
	"database/sql"

	"github.com/gofrs/uuid"
)

type TagCategory struct {
	ID          uuid.UUID       `db:"id" json:"id"`
	Name        string          `db:"name" json:"name"`
	Group       string          `db:"group" json:"group"`
	Description sql.NullString  `db:"description" json:"description"`
	CreatedAt   SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt   SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

func (p TagCategory) GetID() uuid.UUID {
	return p.ID
}

type TagCategories []*TagCategory

func (p TagCategories) Each(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *TagCategories) Add(o interface{}) {
	*p = append(*p, o.(*TagCategory))
}

func (p *TagCategory) CopyFromCreateInput(input TagCategoryCreateInput) {
	CopyFull(p, input)
}

func (p *TagCategory) CopyFromUpdateInput(input TagCategoryUpdateInput) {
	CopyFull(p, input)
}
