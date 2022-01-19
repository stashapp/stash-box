package sqlx

import (
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

const (
	draftTable = "drafts"
)

var (
	draftDBTable = newTable(draftTable, func() interface{} {
		return &models.Draft{}
	})
)

type draftQueryBuilder struct {
	dbi *dbi
}

func newDraftQueryBuilder(txn *txnState) models.DraftRepo {
	return &draftQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *draftQueryBuilder) toModel(ro interface{}) *models.Draft {
	if ro != nil {
		return ro.(*models.Draft)
	}

	return nil
}

func (qb *draftQueryBuilder) Create(newDraft models.Draft) (*models.Draft, error) {
	ret, err := qb.dbi.Insert(draftDBTable, newDraft)
	return qb.toModel(ret), err
}

func (qb *draftQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, draftDBTable)
}

func (qb *draftQueryBuilder) FindExpired(timeLimit int) ([]*models.Draft, error) {
	output := models.Drafts{}
	query := "SELECT * FROM drafts WHERE created_at <= (now()::timestamp - (INTERVAL '1 second' * $1))"
	args := []interface{}{timeLimit}
	err := qb.dbi.RawQuery(draftDBTable, query, args, &output)

	return output, err
}

func (qb *draftQueryBuilder) Find(id uuid.UUID) (*models.Draft, error) {
	ret, err := qb.dbi.Find(id, draftDBTable)
	return qb.toModel(ret), err
}

func (qb *draftQueryBuilder) FindByUser(userID uuid.UUID) ([]*models.Draft, error) {
	output := models.Drafts{}

	query := "SELECT * FROM drafts WHERE user_id = ?"
	args := []interface{}{userID}
	err := qb.dbi.RawQuery(draftDBTable, query, args, &output)

	return output, err
}
