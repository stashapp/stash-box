package models

import (
	"errors"
	"time"

	"database/sql"

	"github.com/gofrs/uuid"
)

type Tag struct {
	ID          uuid.UUID      `db:"id" json:"id"`
	Name        string         `db:"name" json:"name"`
	CategoryID  uuid.NullUUID  `db:"category_id" json:"category_id"`
	Description sql.NullString `db:"description" json:"description"`
	CreatedAt   time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time      `db:"updated_at" json:"updated_at"`
	Deleted     bool           `db:"deleted" json:"deleted"`
}

func (Tag) IsSceneDraftTag() {}

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

func CreateTagAliases(tagID uuid.UUID, aliases []string) []*TagAlias {
	var ret []*TagAlias

	for _, alias := range aliases {
		ret = append(ret, &TagAlias{TagID: tagID, Alias: alias})
	}

	return ret
}

func (p *Tag) IsEditTarget() {
}

func (p *Tag) CopyFromCreateInput(input TagCreateInput) {
	CopyFull(p, input)

	if input.CategoryID != nil {
		p.CategoryID = uuid.NullUUID{UUID: *input.CategoryID, Valid: true}
	}
}

func (p *Tag) CopyFromUpdateInput(input TagUpdateInput) {
	CopyFull(p, input)

	if input.CategoryID != nil {
		p.CategoryID = uuid.NullUUID{UUID: *input.CategoryID, Valid: true}
	} else {
		p.CategoryID = uuid.NullUUID{UUID: uuid.UUID{}, Valid: false}
	}
}

func (p *Tag) CopyFromTagEdit(input TagEdit, existing *TagEdit) {
	fe := fromEdit{}
	fe.string(&p.Name, input.Name)
	fe.nullString(&p.Description, input.Description, existing.Description)
	fe.nullUUID(&p.CategoryID, input.CategoryID, existing.CategoryID)
}

func (p *Tag) ValidateModifyEdit(edit TagEditData) error {
	v := editValidator{}

	v.string("name", edit.Old.Name, p.Name)
	v.string("description", edit.Old.Description, p.Description.String)
	v.uuid("CategoryID", edit.Old.CategoryID, p.CategoryID)

	return v.err
}
