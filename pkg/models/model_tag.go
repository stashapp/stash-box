package models

import (
	"errors"

	"database/sql"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/database"
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

	tagRedirectTable = database.NewTableJoin(tagTable, "tag_redirects", "source_id", func() interface{} {
		return &TagRedirect{}
	})
)

type Tag struct {
	ID          uuid.UUID       `db:"id" json:"id"`
	Name        string          `db:"name" json:"name"`
	CategoryID  uuid.NullUUID   `db:"category_id" json:"category_id"`
	Description sql.NullString  `db:"description" json:"description"`
	CreatedAt   SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt   SQLiteTimestamp `db:"updated_at" json:"updated_at"`
	Deleted     bool            `db:"deleted" json:"deleted"`
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

type TagRedirect struct {
	SourceID uuid.UUID `db:"source_id" json:"source_id"`
	TargetID uuid.UUID `db:"target_id" json:"target_id"`
}

type TagAlias struct {
	TagID uuid.UUID `db:"tag_id" json:"tag_id"`
	Alias string    `db:"alias" json:"alias"`
}

type TagAliases []*TagAlias

func (p TagAliases) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *TagAliases) Add(o interface{}) {
	*p = append(*p, o.(*TagAlias))
}

func (p *TagAliases) Remove(alias string) {
	for i, a := range *p {
		if a.Alias == alias {
			*p = append((*p)[:i], (*p)[i+1:]...)
			break
		}
	}
}

func (p *TagAliases) AddAliases(newAliases []*TagAlias) error {
	aliasMap := map[string]bool{}
	for _, x := range *p {
		aliasMap[x.Alias] = true
	}
	for _, v := range newAliases {
		if aliasMap[v.Alias] {
			return errors.New("Invalid alias addition. Alias already exists '" + v.Alias + "'")
		}
	}
	for _, v := range newAliases {
		p.Add(v)
	}
	return nil
}

func (p *TagAliases) RemoveAliases(oldAliases []string) error {
	aliasMap := map[string]bool{}
	for _, x := range *p {
		aliasMap[x.Alias] = true
	}
	for _, v := range oldAliases {
		if !aliasMap[v] {
			return errors.New("Invalid alias removal. Alias does not exist: '" + v + "'")
		}
	}
	for _, v := range oldAliases {
		p.Remove(v)
	}
	return nil
}

func (p TagAliases) ToAliases() []string {
	var ret []string
	for _, v := range p {
		ret = append(ret, v.Alias)
	}

	return ret
}

func CreateTagAliases(tagId uuid.UUID, aliases []string) []*TagAlias {
	var ret []*TagAlias

	for _, alias := range aliases {
		ret = append(ret, &TagAlias{TagID: tagId, Alias: alias})
	}

	return ret
}

func (p *Tag) IsEditTarget() {
}

func (p *Tag) CopyFromCreateInput(input TagCreateInput) {
	CopyFull(p, input)

	if input.CategoryID != nil {
		UUID, err := uuid.FromString(*input.CategoryID)
		if err == nil {
			p.CategoryID = uuid.NullUUID{UUID: UUID, Valid: true}
		}
	}
}

func (p *Tag) CopyFromUpdateInput(input TagUpdateInput) {
	CopyFull(p, input)

	if input.CategoryID != nil {
		UUID, err := uuid.FromString(*input.CategoryID)
		if err == nil {
			p.CategoryID = uuid.NullUUID{UUID: UUID, Valid: true}
		}
	} else {
		p.CategoryID = uuid.NullUUID{UUID: uuid.UUID{}, Valid: false}
	}
}

func (p *Tag) CopyFromTagEdit(input TagEdit) {
	if input.Name != nil {
		p.Name = *input.Name
	}
	if input.Description != nil {
		p.Description = sql.NullString{String: *input.Description, Valid: true}
	} else {
		p.Description = sql.NullString{Valid: false}
	}
	if input.CategoryID != nil {
		UUID, err := uuid.FromString(*input.CategoryID)
		if err == nil {
			p.CategoryID = uuid.NullUUID{UUID: UUID, Valid: true}
		}
	} else {
		p.CategoryID = uuid.NullUUID{UUID: uuid.UUID{}, Valid: false}
	}
}

func (p *Tag) ValidateModifyEdit(edit TagEditData) error {
	if edit.Old.Name != nil && *edit.Old.Name != p.Name {
		return errors.New("Invalid name. Expected '" + *edit.Old.Name + "'  but was '" + p.Name + "'")
	}
	if edit.Old.Description != nil && *edit.Old.Description != p.Description.String {
		return errors.New("Invalid description. Expected '" + *edit.Old.Description + "'  but was '" + p.Description.String + "'")
	}
	if edit.Old.CategoryID != nil && (!p.CategoryID.Valid || (*edit.Old.CategoryID != p.CategoryID.UUID.String())) {
		return errors.New("Invalid CategoryID. Expected '" + *edit.Old.CategoryID)
	}

	return nil
}
