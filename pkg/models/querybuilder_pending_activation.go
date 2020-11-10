package models

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stashdb/pkg/database"
)

type PendingActivationFinder interface {
	Find(id uuid.UUID) (*PendingActivation, error)
	FindByEmail(email string, activationType string) (*PendingActivation, error)
	FindByInviteKey(key string, activationType string) (*PendingActivation, error)
}

type PendingActivationCreator interface {
	Create(newActivation PendingActivation) (*PendingActivation, error)
}

type PendingActivationQueryBuilder struct {
	dbi database.DBI
}

func NewPendingActivationQueryBuilder(tx *sqlx.Tx) PendingActivationQueryBuilder {
	return PendingActivationQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *PendingActivationQueryBuilder) toModel(ro interface{}) *PendingActivation {
	if ro != nil {
		return ro.(*PendingActivation)
	}

	return nil
}

func (qb *PendingActivationQueryBuilder) Create(newActivation PendingActivation) (*PendingActivation, error) {
	ret, err := qb.dbi.Insert(newActivation)
	return qb.toModel(ret), err
}

func (qb *PendingActivationQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, pendingActivationDBTable)
}

func (qb *PendingActivationQueryBuilder) DestroyExpired(expireTime time.Time) error {
	q := database.NewDeleteQueryBuilder(pendingActivationDBTable)
	q.AddWhere("time <= ?")
	q.AddArg(SQLiteTimestamp{
		Timestamp: expireTime,
	})
	return qb.dbi.DeleteQuery(*q)
}

func (qb *PendingActivationQueryBuilder) Find(id uuid.UUID) (*PendingActivation, error) {
	ret, err := qb.dbi.Find(id, pendingActivationDBTable)
	return qb.toModel(ret), err
}

func (qb *PendingActivationQueryBuilder) FindByEmail(email string, activationType string) (*PendingActivation, error) {
	query := `SELECT * FROM ` + pendingActivationTable + ` WHERE email = ? AND type = ?`
	var args []interface{}
	args = append(args, email)
	args = append(args, activationType)
	output := PendingActivations{}
	err := qb.dbi.RawQuery(pendingActivationDBTable, query, args, &output)
	if err != nil {
		return nil, err
	}

	if len(output) > 0 {
		return output[0], nil
	}
	return nil, nil
}

func (qb *PendingActivationQueryBuilder) FindByInviteKey(key string, activationType string) (*PendingActivation, error) {
	query := `SELECT * FROM ` + pendingActivationTable + ` WHERE invite_key = ? AND type = ?`
	var args []interface{}
	args = append(args, key)
	args = append(args, activationType)
	output := PendingActivations{}
	err := qb.dbi.RawQuery(pendingActivationDBTable, query, args, &output)
	if err != nil {
		return nil, err
	}

	if len(output) > 0 {
		return output[0], nil
	}
	return nil, nil
}

func (qb *PendingActivationQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT "+pendingActivationTable+".id FROM "+pendingActivationTable), nil)
}
