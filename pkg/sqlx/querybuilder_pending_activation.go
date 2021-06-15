package sqlx

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

const (
	pendingActivationTable = "pending_activations"
)

var (
	pendingActivationDBTable = newTable(pendingActivationTable, func() interface{} {
		return &models.PendingActivation{}
	})
)

type pendingActivationQueryBuilder struct {
	dbi *dbi
}

func newPendingActivationQueryBuilder(txn *txnState) models.PendingActivationRepo {
	return &pendingActivationQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *pendingActivationQueryBuilder) toModel(ro interface{}) *models.PendingActivation {
	if ro != nil {
		return ro.(*models.PendingActivation)
	}

	return nil
}

func (qb *pendingActivationQueryBuilder) Create(newActivation models.PendingActivation) (*models.PendingActivation, error) {
	ret, err := qb.dbi.Insert(pendingActivationDBTable, newActivation)
	return qb.toModel(ret), err
}

func (qb *pendingActivationQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, pendingActivationDBTable)
}

func (qb *pendingActivationQueryBuilder) DestroyExpired(expireTime time.Time) error {
	q := newDeleteQueryBuilder(pendingActivationDBTable)
	q.AddWhere("time <= ?")
	q.AddArg(models.SQLiteTimestamp{
		Timestamp: expireTime,
	})
	return qb.dbi.DeleteQuery(*q)
}

func (qb *pendingActivationQueryBuilder) Find(id uuid.UUID) (*models.PendingActivation, error) {
	ret, err := qb.dbi.Find(id, pendingActivationDBTable)
	return qb.toModel(ret), err
}

func (qb *pendingActivationQueryBuilder) FindByEmail(email string, activationType string) (*models.PendingActivation, error) {
	query := `SELECT * FROM ` + pendingActivationTable + ` WHERE email = ? AND type = ?`
	var args []interface{}
	args = append(args, email)
	args = append(args, activationType)
	output := models.PendingActivations{}
	err := qb.dbi.RawQuery(pendingActivationDBTable, query, args, &output)
	if err != nil {
		return nil, err
	}

	if len(output) > 0 {
		return output[0], nil
	}
	return nil, nil
}

func (qb *pendingActivationQueryBuilder) FindByInviteKey(key string, activationType string) (*models.PendingActivation, error) {
	query := `SELECT * FROM ` + pendingActivationTable + ` WHERE invite_key = ? AND type = ?`
	var args []interface{}
	args = append(args, key)
	args = append(args, activationType)
	output := models.PendingActivations{}
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
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT "+pendingActivationTable+".id FROM "+pendingActivationTable), nil)
}
