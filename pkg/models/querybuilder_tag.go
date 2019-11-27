package models

import (
	"github.com/jmoiron/sqlx"

	"github.com/stashapp/stashdb/pkg/database"
)

type TagQueryBuilder struct {
	dbi database.DBI
}

func NewTagQueryBuilder(tx *sqlx.Tx) TagQueryBuilder {
	return TagQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *TagQueryBuilder) toModel(ro interface{}) *Tag {
	if ro != nil {
		return ro.(*Tag)
	}

	return nil
}

func (qb *TagQueryBuilder) Create(newTag Tag) (*Tag, error) {
	ret, err := qb.dbi.Insert(newTag)
	return qb.toModel(ret), err
}

func (qb *TagQueryBuilder) Update(updatedTag Tag) (*Tag, error) {
	ret, err := qb.dbi.Update(updatedTag)
	return qb.toModel(ret), err
}

func (qb *TagQueryBuilder) Destroy(id int64) error {
	return qb.dbi.Delete(id, tagDBTable)
}

func (qb *TagQueryBuilder) CreateAliases(newJoins TagAliases) error {
	return qb.dbi.InsertJoins(tagAliasTable, &newJoins)
}

func (qb *TagQueryBuilder) UpdateAliases(tagID int64, updatedJoins TagAliases) error {
	return qb.dbi.ReplaceJoins(tagAliasTable, tagID, &updatedJoins)
}

func (qb *TagQueryBuilder) Find(id int64) (*Tag, error) {
	ret, err := qb.dbi.Find(id, tagDBTable)
	return qb.toModel(ret), err
}

func (qb *TagQueryBuilder) FindByNameOrAlias(name string) (*Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tags.id = tag_aliases.tag_id
		WHERE tag_aliases.alias = ? OR tags.name = ?`

	args := []interface{}{name, name}
	results, err := qb.queryTags(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *TagQueryBuilder) FindBySceneID(sceneID int64) ([]*Tag, error) {
	query := `
		SELECT tags.* FROM tags
		LEFT JOIN scene_tags as scenes_join on scenes_join.tag_id = tags.id
		LEFT JOIN scenes on scenes_join.scene_id = scenes.id
		WHERE scenes.id = ?
		GROUP BY tags.id
	`
	args := []interface{}{sceneID}
	return qb.queryTags(query, args)
}

func (qb *TagQueryBuilder) FindByNames(names []string) ([]*Tag, error) {
	query := "SELECT * FROM tags WHERE name IN " + getInBinding(len(names))
	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryTags(query, args)
}

func (qb *TagQueryBuilder) FindByAliases(names []string) ([]*Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tags.id = tag_aliases.tag_id
		WHERE tag_aliases.alias IN ` + getInBinding(len(names))

	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryTags(query, args)
}

func (qb *TagQueryBuilder) FindByName(name string) ([]*Tag, error) {
	query := "SELECT * FROM tags WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	return qb.queryTags(query, args)
}

func (qb *TagQueryBuilder) FindByAlias(name string) ([]*Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tag.id = tag_aliases.tag_id
		WHERE upper(tag_aliases.alias) = UPPER(?)`

	var args []interface{}
	args = append(args, name)
	return qb.queryTags(query, args)
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

func (qb *TagQueryBuilder) queryTags(query string, args []interface{}) (Tags, error) {
	var output Tags
	err := qb.dbi.RawQuery(tagDBTable, query, args, &output)
	return output, err
}

func (qb *TagQueryBuilder) GetAliases(id int64) ([]string, error) {
	joins := TagAliases{}
	err := qb.dbi.FindJoins(tagAliasTable, id, &joins)

	return joins.ToAliases(), err
}
