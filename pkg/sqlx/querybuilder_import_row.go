package sqlx

import (
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

const (
	importRowTable = "import_data"
)

var (
	importRowDBTable = newTable(importRowTable, func() interface{} {
		return &models.ImportRow{}
	})
)

type importRowQueryBuilder struct {
	dbi *dbi
}

func newImportRowQueryBuilder(txn *txnState) models.ImportRowRepo {
	return &importRowQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *importRowQueryBuilder) Create(newRow models.ImportRow) (*models.ImportRow, error) {
	if err := qb.dbi.InsertObject(importRowDBTable, newRow); err != nil {
		return nil, err
	}
	return &newRow, nil
}

func (qb *importRowQueryBuilder) Update(updatedRow models.ImportRow) (*models.ImportRow, error) {
	// need to update by user and row
	ensureTx(qb.dbi.txn)

	t := importRowTable
	if _, err := qb.dbi.db().NamedExec(
		`UPDATE `+t+` SET `+sqlGenKeys(qb.dbi.txn.dialect, updatedRow, true)+` WHERE `+t+`.user_id = :user_id AND `+t+`.row = :row`,
		updatedRow,
	); err != nil {
		return nil, err
	}

	// don't want to modify the existing object
	updatedModel := &models.ImportRow{}
	query := qb.dbi.db().Rebind(`SELECT * FROM ` + t + ` WHERE ` + t + `.user_id = ? AND ` + t + `.row = ?`)
	if err := qb.dbi.db().Get(updatedModel, query, updatedRow.UserID, updatedRow.Row); err != nil {
		return nil, err
	}

	return updatedModel, nil
}

func (qb *importRowQueryBuilder) DestroyForUser(userID uuid.UUID) error {
	q := newDeleteQueryBuilder(importRowDBTable)
	q.AddWhere("user_id = ?")
	q.AddArg(userID)
	return qb.dbi.DeleteQuery(*q)
}

func (qb *importRowQueryBuilder) QueryForUser(userID uuid.UUID, findFilter *models.QuerySpec) (models.ImportRows, int) {
	if findFilter == nil {
		findFilter = &models.QuerySpec{}
	}

	query := newQueryBuilder(importRowDBTable)
	query.AddWhere("user_id = ?")
	query.AddArg(userID)

	query.SortAndPagination = getSort(qb.dbi.txn.dialect, "row", "ASC", importRowTable, nil) + getPagination(findFilter)
	var rows models.ImportRows
	countResult, err := qb.dbi.Query(*query, &rows)

	if err != nil {
		// TODO
		panic(err)
	}

	return rows, countResult
}
