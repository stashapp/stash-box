package models

import (
	"database/sql"
    "github.com/satori/go.uuid"

	"github.com/stashapp/stashdb/pkg/database"
)

const (
	tagTable   = "tags"
	tagJoinKey = "tag_id"
)

var (
	tagDBTable = database.NewTable(tagTable, func() interface{} {
		return &Tag{}
	})

	tagAliasTable = database.NewTableJoin(tagTable, "tag_aliases", tagJoinKey, func() interface{} {
		return &TagAlias{}
	})
)

type Tag struct {
	ID          uuid.UUID       `db:"id" json:"id"`
	Name        string          `db:"name" json:"name"`
	Description sql.NullString  `db:"description" json:"description"`
	CreatedAt   SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt   SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

func (Tag) GetTable() database.Table {
	return tagDBTable
}

func (p Tag) GetID() uuid.UUID {
	return p.ID
}

type Tags []*Tag

func (p Tags) Each(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *Tags) Add(o interface{}) {
	*p = append(*p, o.(*Tag))
}

type TagAlias struct {
	TagID uuid.UUID `db:"tag_id" json:"tag_id"`
	Alias string    `db:"alias" json:"alias"`
}

type TagAliases []TagAlias

func (p TagAliases) Each(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *TagAliases) Add(o interface{}) {
	*p = append(*p, o.(TagAlias))
}

func (p TagAliases) ToAliases() []string {
	var ret []string
	for _, v := range p {
		ret = append(ret, v.Alias)
	}

	return ret
}

func CreateTagAliases(tagId uuid.UUID, aliases []string) []TagAlias {
	var ret []TagAlias

	for _, alias := range aliases {
		ret = append(ret, TagAlias{TagID: tagId, Alias: alias})
	}

	return ret
}

func (p *Tag) IsEditTarget() {
}

func (p *Tag) CopyFromCreateInput(input TagCreateInput) {
	CopyFull(p, input)
}

func (p *Tag) CopyFromUpdateInput(input TagUpdateInput) {
	CopyFull(p, input)
}
