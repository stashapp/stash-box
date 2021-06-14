package models

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/sqlx"
)

type pendingActivationQueryBuilder struct {
	dbi database.DBI
}

func newPendingActivationQueryBuilder(txn *sqlx.TxnMgr) PendingActivationRepo {
	return &pendingActivationQueryBuilder{
		dbi: database.NewDBI(txn),
	}
}

func (qb *pendingActivationQueryBuilder) toModel(ro interface{}) *PendingActivation {
	if ro != nil {
		return ro.(*PendingActivation)
	}

	return nil
}

func (qb *pendingActivationQueryBuilder) Create(newActivation PendingActivation) (*PendingActivation, error) {
	ret, err := qb.dbi.Insert(newActivation)
	return qb.toModel(ret), err
}

func (qb *pendingActivationQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, pendingActivationDBTable)
}

func (qb *pendingActivationQueryBuilder) DestroyExpired(expireTime time.Time) error {
	q := database.NewDeleteQueryBuilder(pendingActivationDBTable)
	q.AddWhere("time <= ?")
	q.AddArg(SQLiteTimestamp{
		Timestamp: expireTime,
	})
	return qb.dbi.DeleteQuery(*q)
}

func (qb *pendingActivationQueryBuilder) Find(id uuid.UUID) (*PendingActivation, error) {
	ret, err := qb.dbi.Find(id, pendingActivationDBTable)
	return qb.toModel(ret), err
}

func (qb *pendingActivationQueryBuilder) FindByEmail(email string, activationType string) (*PendingActivation, error) {
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

func (qb *pendingActivationQueryBuilder) FindByInviteKey(key string, activationType string) (*PendingActivation, error) {
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

func (qb *pendingActivationQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT "+pendingActivationTable+".id FROM "+pendingActivationTable), nil)
}
