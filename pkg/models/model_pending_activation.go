package models

import (
	"time"

	"github.com/gofrs/uuid"
)

const (
	PendingActivationTypeNewUser       = "newUser"
	PendingActivationTypeResetPassword = "resetPassword"
)

type PendingActivation struct {
	ID        uuid.UUID     `db:"id" json:"id"`
	Email     string        `db:"email" json:"email"`
	InviteKey uuid.NullUUID `db:"invite_key" json:"invite_key"`
	Type      string        `db:"type" json:"type"`
	Time      time.Time     `db:"time" json:"time"`
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
