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
