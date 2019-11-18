package models

import (
	"database/sql"
)

type Tag struct {
	ID          int64           `db:"id" json:"id"`
	Name        string          `db:"name" json:"name"`
	Description sql.NullString  `db:"description" json:"description"`
	CreatedAt   SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt   SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

type TagAliases struct {
	TagID int64  `db:"tag_id" json:"tag_id"`
	Alias string `db:"alias" json:"alias"`
}

func CreateTagAliases(tagId int64, aliases []string) []TagAliases {
	var ret []TagAliases

	for _, alias := range aliases {
		ret = append(ret, TagAliases{TagID: tagId, Alias: alias})
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
