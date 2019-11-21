package models

import (
	"database/sql"

	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
	"github.com/stashapp/stashdb/pkg/database"
)

type TagQueryBuilder struct{}

const tagTable = "tags"
const tagAliasesJoinTable = "tag_aliases"
const tagJoinKey = "tag_id"

func NewTagQueryBuilder() TagQueryBuilder {
	return TagQueryBuilder{}
}

func (qb *TagQueryBuilder) Create(newTag Tag, tx *sqlx.Tx) (*Tag, error) {
	tagID, err := insertObject(tx, tagTable, newTag)

	if err != nil {
		return nil, errors.Wrap(err, "Error creating tag")
	}

	if err := getByID(tx, tagTable, tagID, &newTag); err != nil {
		return nil, errors.Wrap(err, "Error getting tag after create")
	}
	return &newTag, nil
}

func (qb *TagQueryBuilder) Update(updatedTag Tag, tx *sqlx.Tx) (*Tag, error) {
	err := updateObjectByID(tx, tagTable, updatedTag)

	if err != nil {
		return nil, errors.Wrap(err, "Error updating tag")
	}

	if err := getByID(tx, tagTable, updatedTag.ID, &updatedTag); err != nil {
		return nil, errors.Wrap(err, "Error getting tag after update")
	}
	return &updatedTag, nil
}

func (qb *TagQueryBuilder) Destroy(id int64, tx *sqlx.Tx) error {
	return executeDeleteQuery(tagTable, id, tx)
}

func (qb *TagQueryBuilder) CreateAliases(newJoins []TagAliases, tx *sqlx.Tx) error {
	return insertJoins(tx, tagAliasesJoinTable, newJoins)
}

func (qb *TagQueryBuilder) UpdateAliases(tagID int64, updatedJoins []TagAliases, tx *sqlx.Tx) error {
	ensureTx(tx)

	// Delete the existing joins and then create new ones
	err := deleteObjectsByColumn(tx, tagAliasesJoinTable, tagJoinKey, tagID)
	if err != nil {
		return err
	}
	return qb.CreateAliases(updatedJoins, tx)
}

func (qb *TagQueryBuilder) Find(id int64) (*Tag, error) {
	query := "SELECT * FROM tags WHERE id = ? LIMIT 1"
	args := []interface{}{id}
	results, err := qb.queryTags(query, args, nil)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *TagQueryBuilder) FindByNameOrAlias(name string) (*Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tags.id = tag_aliases.tag_id
		WHERE tag_aliases.alias = ? OR tags.name = ?`

	args := []interface{}{name, name}
	results, err := qb.queryTags(query, args, nil)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *TagQueryBuilder) FindBySceneID(sceneID int64, tx *sqlx.Tx) ([]*Tag, error) {
	query := `
		SELECT tags.* FROM tags
		LEFT JOIN scenes_tags as scenes_join on scenes_join.tag_id = tags.id
		LEFT JOIN scenes on scenes_join.scene_id = scenes.id
		WHERE scenes.id = ?
		GROUP BY tags.id
	`
	args := []interface{}{sceneID}
	return qb.queryTags(query, args, tx)
}

func (qb *TagQueryBuilder) FindByNames(names []string, tx *sqlx.Tx) ([]*Tag, error) {
	query := "SELECT * FROM tags WHERE name IN " + getInBinding(len(names))
	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryTags(query, args, tx)
}

func (qb *TagQueryBuilder) FindByAliases(names []string, tx *sqlx.Tx) ([]*Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tags.id = tag_aliases.tag_id
		WHERE tag_aliases.alias IN ` + getInBinding(len(names))

	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryTags(query, args, tx)
}

func (qb *TagQueryBuilder) FindByName(name string, tx *sqlx.Tx) ([]*Tag, error) {
	query := "SELECT * FROM tags WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	return qb.queryTags(query, args, tx)
}

func (qb *TagQueryBuilder) FindByAlias(name string, tx *sqlx.Tx) ([]*Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tag.id = tag_aliases.tag_id
		WHERE upper(tag_aliases.alias) = UPPER(?)`

	var args []interface{}
	args = append(args, name)
	return qb.queryTags(query, args, tx)
}

func (qb *TagQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT tags.id FROM tags"), nil)
}

func (qb *TagQueryBuilder) Query(tagFilter *TagFilterType, findFilter *QuerySpec) ([]*Tag, int) {
	if tagFilter == nil {
		tagFilter = &TagFilterType{}
	}
	if findFilter == nil {
		findFilter = &QuerySpec{}
	}

	query := queryBuilder{
		tableName: tagTable,
	}

	query.body = selectDistinctIDs(tagTable)

	if q := tagFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"tags.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false)
		query.addWhere(clause)
		query.addArg(thisArgs...)
	}

	query.sortAndPagination = qb.getTagSort(findFilter) + getPagination(findFilter)
	idsResult, countResult := query.executeFind()

	var tags []*Tag
	for _, id := range idsResult {
		tag, _ := qb.Find(id)
		tags = append(tags, tag)
	}

	return tags, countResult
}

func (qb *TagQueryBuilder) getTagSort(findFilter *QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(sort, direction, tagTable)
}

func (qb *TagQueryBuilder) queryTags(query string, args []interface{}, tx *sqlx.Tx) ([]*Tag, error) {
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

	tags := make([]*Tag, 0)
	for rows.Next() {
		tag := Tag{}
		if err := rows.StructScan(&tag); err != nil {
			return nil, err
		}
		tags = append(tags, &tag)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tags, nil
}

func (qb *TagQueryBuilder) GetAliases(id int64) ([]string, error) {
	query := "SELECT alias FROM tag_aliases WHERE tag_id = ?"
	args := []interface{}{id}

	var rows *sqlx.Rows
	var err error
	rows, err = database.DB.Queryx(query, args...)

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	defer rows.Close()

	aliases := make([]string, 0)
	for rows.Next() {
		var alias string

		if err := rows.Scan(&alias); err != nil {
			return nil, err
		}
		aliases = append(aliases, alias)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return aliases, nil
}
