package models

import (
	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stashdb/pkg/database"
)

type InviteKeyCreator interface {
	Create(newKey InviteKey) (*InviteKey, error)
}

type InviteKeyFinder interface {
	Find(id uuid.UUID) (*InviteKey, error)
}

type InviteKeyDestroyer interface {
	InviteKeyFinder
	Destroy(id uuid.UUID) error
}

type InviteKeyQueryBuilder struct {
	dbi database.DBI
}

func NewInviteCodeQueryBuilder(tx *sqlx.Tx) InviteKeyQueryBuilder {
	return InviteKeyQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *InviteKeyQueryBuilder) toModel(ro interface{}) *InviteKey {
	if ro != nil {
		return ro.(*InviteKey)
	}

	return nil
}

func (qb *InviteKeyQueryBuilder) Create(newKey InviteKey) (*InviteKey, error) {
	ret, err := qb.dbi.Insert(newKey)
	return qb.toModel(ret), err
}

func (qb *InviteKeyQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, inviteKeyDBTable)
}

func (qb *InviteKeyQueryBuilder) Find(id uuid.UUID) (*InviteKey, error) {
	ret, err := qb.dbi.Find(id, inviteKeyDBTable)
	return qb.toModel(ret), err
}

func (qb *InviteKeyQueryBuilder) FindActiveKeysForUser(userID uuid.UUID) (InviteKeys, error) {
	// TODO - exclude keys in activation table
	query := `SELECT * FROM ` + inviteKeyTable + ` WHERE generated_by = ?`
	var args []interface{}
	args = append(args, userID)
	output := InviteKeys{}
	err := qb.dbi.RawQuery(inviteKeyDBTable, query, args, &output)
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (qb *InviteKeyQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT invite_keys.id FROM invite_keys"), nil)
}
