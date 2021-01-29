package models

import (
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/database"
)

const (
	pendingActivationTable = "pending_activations"
)

var (
	pendingActivationDBTable = database.NewTable(pendingActivationTable, func() interface{} {
		return &PendingActivation{}
	})
)

const (
	PendingActivationTypeNewUser       = "newUser"
	PendingActivationTypeResetPassword = "resetPassword"
)

type PendingActivation struct {
	ID        uuid.UUID       `db:"id" json:"id"`
	Email     string          `db:"email" json:"email"`
	InviteKey uuid.NullUUID   `db:"invite_key" json:"invite_key"`
	Type      string          `db:"type" json:"type"`
	Time      SQLiteTimestamp `db:"time" json:"time"`
}

func (PendingActivation) GetTable() database.Table {
	return pendingActivationDBTable
}

func (p PendingActivation) GetID() uuid.UUID {
	return p.ID
}

type PendingActivations []*PendingActivation

func (p PendingActivations) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *PendingActivations) Add(o interface{}) {
	*p = append(*p, o.(*PendingActivation))
}
