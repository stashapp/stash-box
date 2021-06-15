package models

import (
	"github.com/gofrs/uuid"
)

type InviteKey struct {
	ID          uuid.UUID       `db:"id" json:"id"`
	GeneratedBy uuid.UUID       `db:"generated_by" json:"generated_by"`
	GeneratedAt SQLiteTimestamp `db:"generated_at" json:"generated_at"`
}

func (p InviteKey) GetID() uuid.UUID {
	return p.ID
}

type InviteKeys []*InviteKey

func (p InviteKeys) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *InviteKeys) Add(o interface{}) {
	*p = append(*p, o.(*InviteKey))
}
