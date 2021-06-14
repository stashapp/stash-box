package models

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/sqlx"
)

type inviteKeyQueryBuilder struct {
	dbi database.DBI
}

func newInviteCodeQueryBuilder(txn *sqlx.TxnMgr) InviteKeyRepo {
	return &inviteKeyQueryBuilder{
		dbi: database.NewDBI(txn),
	}
}

func (qb *inviteKeyQueryBuilder) toModel(ro interface{}) *InviteKey {
	if ro != nil {
		return ro.(*InviteKey)
	}

	return nil
}

func (qb *inviteKeyQueryBuilder) Create(newKey InviteKey) (*InviteKey, error) {
	ret, err := qb.dbi.Insert(newKey)
	return qb.toModel(ret), err
}

func (qb *inviteKeyQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, inviteKeyDBTable)
}

func (qb *inviteKeyQueryBuilder) Find(id uuid.UUID) (*InviteKey, error) {
	ret, err := qb.dbi.Find(id, inviteKeyDBTable)
	return qb.toModel(ret), err
}

func (qb *inviteKeyQueryBuilder) FindActiveKeysForUser(userID uuid.UUID, expireTime time.Time) (InviteKeys, error) {
	query := `SELECT i.* FROM ` + inviteKeyTable + ` i 
	 LEFT JOIN ` + pendingActivationTable + ` a ON a.invite_key = i.id AND a.time > ?
	 WHERE i.generated_by = ? AND a.id IS NULL`
	var args []interface{}
	args = append(args, SQLiteTimestamp{
		Timestamp: expireTime,
	})
	args = append(args, userID)
	output := InviteKeys{}
	err := qb.dbi.RawQuery(inviteKeyDBTable, query, args, &output)
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (qb *inviteKeyQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT invite_keys.id FROM invite_keys"), nil)
}
