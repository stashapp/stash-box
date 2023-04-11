package sqlx

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"gopkg.in/guregu/null.v4"
)

const (
	inviteKeyTable = "invite_keys"
)

type inviteKeyRow struct {
	ID          uuid.UUID `db:"id" json:"id"`
	Uses        null.Int  `db:"uses" json:"uses"`
	GeneratedBy uuid.UUID `db:"generated_by" json:"generated_by"`
	GeneratedAt time.Time `db:"generated_at" json:"generated_at"`
	ExpireTime  null.Time `db:"expire_time" json:"expire_time"`
}

func (p inviteKeyRow) GetID() uuid.UUID {
	return p.ID
}

func (p *inviteKeyRow) fromInviteKey(i models.InviteKey) {
	p.ID = i.ID
	if i.Uses != nil {
		p.Uses = null.IntFrom(int64(*i.Uses))
	}
	p.GeneratedBy = i.GeneratedBy
	p.GeneratedAt = i.GeneratedAt
	p.ExpireTime = null.TimeFromPtr(i.Expires)
}

func (p inviteKeyRow) resolve() models.InviteKey {
	return models.InviteKey{
		ID:          p.ID,
		Uses:        intPtrFromNullInt(p.Uses),
		GeneratedBy: p.GeneratedBy,
		GeneratedAt: p.GeneratedAt,
		Expires:     p.ExpireTime.Ptr(),
	}
}

type inviteKeyRows []*inviteKeyRow

func (p inviteKeyRows) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *inviteKeyRows) Add(o interface{}) {
	*p = append(*p, o.(*inviteKeyRow))
}

func (p inviteKeyRows) resolve() models.InviteKeys {
	ret := make(models.InviteKeys, len(p))
	for i, v := range p {
		vv := v.resolve()
		ret[i] = &vv
	}
	return ret
}

var (
	inviteKeyDBTable = newTable(inviteKeyTable, func() interface{} {
		return inviteKeyRow{}
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
	if ro == nil {
		return nil
	}

	r := ro.(inviteKeyRow)
	ret := r.resolve()
	return &ret
}

func (qb *inviteKeyQueryBuilder) Create(newKey models.InviteKey) (*models.InviteKey, error) {
	r := inviteKeyRow{}
	r.fromInviteKey(newKey)
	ret, err := qb.dbi.Insert(inviteKeyDBTable, r)
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
	output := inviteKeyRows{}
	err := qb.dbi.RawQuery(inviteKeyDBTable, query, args, &output)
	if err != nil {
		return nil, err
	}
	return output.resolve(), nil
}

func (qb *inviteKeyQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT invite_keys.id FROM invite_keys"), nil)
}

func (qb *inviteKeyQueryBuilder) KeyUsed(id uuid.UUID) (*int, error) {
	query := `UPDATE ` + inviteKeyTable + ` SET uses = uses - 1 WHERE id = ?`
	var args []interface{}
	args = append(args, id)
	err := qb.dbi.RawExec(query, args)
	if err != nil {
		return nil, err
	}

	n, err := qb.Find(id)
	if err != nil {
		return nil, err
	}

	return n.Uses, nil
}
