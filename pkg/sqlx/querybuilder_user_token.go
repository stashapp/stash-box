package sqlx

import (
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

const (
	userTokenTable = "user_tokens"
)

var (
	userTokenDBTable = newTable(userTokenTable, func() interface{} {
		return &models.UserToken{}
	})
)

type userTokenQueryBuilder struct {
	dbi *dbi
}

func newUserTokenQueryBuilder(txn *txnState) models.UserTokenRepo {
	return &userTokenQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *userTokenQueryBuilder) toModel(ro interface{}) *models.UserToken {
	if ro != nil {
		return ro.(*models.UserToken)
	}

	return nil
}

func (qb *userTokenQueryBuilder) Create(newActivation models.UserToken) (*models.UserToken, error) {
	ret, err := qb.dbi.Insert(userTokenDBTable, newActivation)
	return qb.toModel(ret), err
}

func (qb *userTokenQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, userTokenDBTable)
}

func (qb *userTokenQueryBuilder) DestroyExpired() error {
	q := newDeleteQueryBuilder(userTokenDBTable)
	q.AddWhere("expires_at <= now()")
	return qb.dbi.DeleteQuery(*q)
}

func (qb *userTokenQueryBuilder) Find(id uuid.UUID) (*models.UserToken, error) {
	ret, err := qb.dbi.Find(id, userTokenDBTable)
	return qb.toModel(ret), err
}

func (qb *userTokenQueryBuilder) FindByInviteKey(key uuid.UUID) ([]*models.UserToken, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE data->>'invite_key' = ?", userTokenTable)
	var args []interface{}
	args = append(args, key)
	output := models.UserTokens{}
	err := qb.dbi.RawQuery(userTokenDBTable, query, args, &output)
	if err != nil {
		return nil, err
	}

	return output, nil
}

func (qb *userTokenQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT "+userTokenTable+".id FROM "+userTokenTable), nil)
}
