package models

import (
	"database/sql"

	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
	"github.com/stashapp/stashdb/pkg/database"
)

type StudioQueryBuilder struct{}

const studioTable = "studios"
const studioUrlsJoinTable = "studio_urls"
const studioJoinKey = "studio_id"

func NewStudioQueryBuilder() StudioQueryBuilder {
	return StudioQueryBuilder{}
}

func (qb *StudioQueryBuilder) Create(newStudio Studio, tx *sqlx.Tx) (*Studio, error) {
	studioID, err := insertObject(tx, studioTable, newStudio)

	if err != nil {
		return nil, errors.Wrap(err, "Error creating studio")
	}

	if err := getByID(tx, studioTable, studioID, &newStudio); err != nil {
		return nil, errors.Wrap(err, "Error getting studio after create")
	}
	return &newStudio, nil
}

func (qb *StudioQueryBuilder) Update(updatedStudio Studio, tx *sqlx.Tx) (*Studio, error) {
	err := updateObjectByID(tx, studioTable, updatedStudio)

	if err != nil {
		return nil, errors.Wrap(err, "Error updating studio")
	}

	if err := getByID(tx, studioTable, updatedStudio.ID, &updatedStudio); err != nil {
		return nil, errors.Wrap(err, "Error getting studio after update")
	}
	return &updatedStudio, nil
}

func (qb *StudioQueryBuilder) Destroy(id int64, tx *sqlx.Tx) error {
	return executeDeleteQuery(studioTable, id, tx)
}

func (qb *StudioQueryBuilder) CreateUrls(newJoins []StudioUrls, tx *sqlx.Tx) error {
	return insertJoins(tx, studioUrlsJoinTable, newJoins)
}

func (qb *StudioQueryBuilder) UpdateUrls(studio int64, updatedJoins []StudioUrls, tx *sqlx.Tx) error {
	ensureTx(tx)

	// Delete the existing joins and then create new ones
	err := deleteObjectsByColumn(tx, studioUrlsJoinTable, studioJoinKey, studio)
	if err != nil {
		return err
	}
	return qb.CreateUrls(updatedJoins, tx)
}

func (qb *StudioQueryBuilder) Find(id int) (*Studio, error) {
	query := "SELECT * FROM studios WHERE id = ? LIMIT 1"
	args := []interface{}{id}
	results, err := qb.queryStudios(query, args, nil)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *StudioQueryBuilder) FindBySceneID(sceneID int, tx *sqlx.Tx) ([]*Studio, error) {
	query := `
		SELECT studios.* FROM studios
		LEFT JOIN scenes on scenes.studio_id = studios.id
		WHERE scenes.id = ?
		GROUP BY studios.id
	`
	args := []interface{}{sceneID}
	return qb.queryStudios(query, args, tx)
}

func (qb *StudioQueryBuilder) FindByNames(names []string, tx *sqlx.Tx) ([]*Studio, error) {
	query := "SELECT * FROM studios WHERE name IN " + getInBinding(len(names))
	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryStudios(query, args, tx)
}

func (qb *StudioQueryBuilder) FindByName(name string, tx *sqlx.Tx) (*Studio, error) {
	query := "SELECT * FROM studios WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	results, err := qb.queryStudios(query, args, tx)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *StudioQueryBuilder) FindByParentID(id int64, tx *sqlx.Tx) ([]*Studio, error) {
	query := "SELECT * FROM studios WHERE parent_studio_id = ?"
	var args []interface{}
	args = append(args, id)
	return qb.queryStudios(query, args, tx)
}

func (qb *StudioQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT studios.id FROM studios"), nil)
}

func (qb *StudioQueryBuilder) Query(studioFilter *StudioFilterType, findFilter *QuerySpec) ([]*Studio, int) {
	if studioFilter == nil {
		studioFilter = &StudioFilterType{}
	}
	if findFilter == nil {
		findFilter = &QuerySpec{}
	}

	query := queryBuilder{
		tableName: studioTable,
	}

	query.body = selectDistinctIDs(studioTable)

	if q := studioFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"studios.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false)
		query.addWhere(clause)
		query.addArg(thisArgs...)
	}

	query.sortAndPagination = qb.getStudioSort(findFilter) + getPagination(findFilter)
	idsResult, countResult := query.executeFind()

	var studios []*Studio
	for _, id := range idsResult {
		studio, _ := qb.Find(id)
		studios = append(studios, studio)
	}

	return studios, countResult
}

func (qb *StudioQueryBuilder) getStudioSort(findFilter *QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(sort, direction, "studios")
}

func (qb *StudioQueryBuilder) queryStudios(query string, args []interface{}, tx *sqlx.Tx) ([]*Studio, error) {
	var rows *sqlx.Rows
	var err error
	if tx != nil {
		rows, err = tx.Queryx(query, args...)
	} else {
		rows, err = database.DB.Queryx(query, args...)
	}

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	defer rows.Close()

	studios := make([]*Studio, 0)
	for rows.Next() {
		studio := Studio{}
		if err := rows.StructScan(&studio); err != nil {
			return nil, err
		}
		studios = append(studios, &studio)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return studios, nil
}

func (qb *StudioQueryBuilder) GetUrls(id int64) ([]StudioUrls, error) {
	query := "SELECT url, type FROM studio_urls WHERE studio_id = ?"
	args := []interface{}{id}

	var rows *sqlx.Rows
	var err error
	rows, err = database.DB.Queryx(query, args...)

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	defer rows.Close()

	urls := make([]StudioUrls, 0)
	for rows.Next() {
		var studioUrl StudioUrls

		if err := rows.Scan(&studioUrl); err != nil {
			return nil, err
		}
		urls = append(urls, studioUrl)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return urls, nil
}
