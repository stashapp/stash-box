package models

import (
	"database/sql"
	"time"

	"github.com/gofrs/uuid"
	"github.com/lib/pq"
)

type Site struct {
	ID          uuid.UUID      `db:"id" json:"id"`
	Name        string         `db:"name" json:"name"`
	Description sql.NullString `db:"description" json:"description"`
	URL         sql.NullString `db:"url" json:"url"`
	Regex       sql.NullString `db:"regex" json:"regex"`
	ValidTypes  pq.StringArray `db:"valid_types" json:"valid_types"`
	CreatedAt   time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time      `db:"updated_at" json:"updated_at"`
}

func (s Site) GetID() uuid.UUID {
	return s.ID
}

type Sites []*Site

func (s Sites) Each(fn func(interface{})) {
	for _, v := range s {
		fn(v)
	}
}

func (s *Sites) Add(o interface{}) {
	*s = append(*s, o.(*Site))
}

func (s *Site) CopyFromCreateInput(input SiteCreateInput) {
	CopyFull(s, input)

	s.ValidTypes = validTypeEnumToString(input.ValidTypes)
}

func (s *Site) CopyFromUpdateInput(input SiteUpdateInput) {
	CopyFull(s, input)

	s.ValidTypes = validTypeEnumToString(input.ValidTypes)
}

func validTypeEnumToString(types []ValidSiteTypeEnum) []string {
	var validTypes []string
	for _, validType := range types {
		validTypes = append(validTypes, validType.String())
	}
	return validTypes
}
