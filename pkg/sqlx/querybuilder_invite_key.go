package sqlx

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

const (
	inviteKeyTable = "invite_keys"
)

var (
	inviteKeyDBTable = newTable(inviteKeyTable, func() interface{} {
		return &models.InviteKey{}
	})
)

type inviteKeyQueryBuilder struct {
	dbi *dbi
}

func newInviteCodeQueryBuilder(txn *txnState) models.InviteKeyRepo {
	return &inviteKeyQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *inviteKeyQueryBuilder) toModel(ro interface{}) *models.InviteKey {
	if ro != nil {
		return ro.(*models.InviteKey)
	}

	return nil
}

func (qb *inviteKeyQueryBuilder) Create(newKey models.InviteKey) (*models.InviteKey, error) {
	ret, err := qb.dbi.Insert(inviteKeyDBTable, newKey)
	return qb.toModel(ret), err
}

func (qb *inviteKeyQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, inviteKeyDBTable)
}

func (qb *inviteKeyQueryBuilder) Find(id uuid.UUID) (*models.InviteKey, error) {
	ret, err := qb.dbi.Find(id, inviteKeyDBTable)
	return qb.toModel(ret), err
}

func (qb *inviteKeyQueryBuilder) FindActiveKeysForUser(userID uuid.UUID, expireTime time.Time) (models.InviteKeys, error) {
	query := `SELECT i.* FROM ` + inviteKeyTable + ` i 
	 LEFT JOIN ` + pendingActivationTable + ` a ON a.invite_key = i.id AND a.time > ?
	 WHERE i.generated_by = ? AND a.id IS NULL`
	var args []interface{}
	args = append(args, expireTime)
	args = append(args, userID)
	output := models.InviteKeys{}
	err := qb.dbi.RawQuery(inviteKeyDBTable, query, args, &output)
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (qb *inviteKeyQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT invite_keys.id FROM invite_keys"), nil)
}
