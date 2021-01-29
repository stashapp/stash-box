package models

import (
	"github.com/jmoiron/sqlx"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/utils"
)

type TagCategoryQueryBuilder struct {
	dbi database.DBI
}

func NewTagCategoryQueryBuilder(tx *sqlx.Tx) TagCategoryQueryBuilder {
	return TagCategoryQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *TagCategoryQueryBuilder) toModel(ro interface{}) *TagCategory {
	if ro != nil {
		return ro.(*TagCategory)
	}

	return nil
}

func (qb *TagCategoryQueryBuilder) Create(newCategory TagCategory) (*TagCategory, error) {
	ret, err := qb.dbi.Insert(newCategory)
	return qb.toModel(ret), err
}

func (qb *TagCategoryQueryBuilder) Update(updatedCategory TagCategory) (*TagCategory, error) {
	ret, err := qb.dbi.Update(updatedCategory, false)
	return qb.toModel(ret), err
}

func (qb *TagCategoryQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, tagCategoryDBTable)
}

func (qb *TagCategoryQueryBuilder) Find(id uuid.UUID) (*TagCategory, error) {
	ret, err := qb.dbi.Find(id, tagCategoryDBTable)
	return qb.toModel(ret), err
}

func (qb *TagCategoryQueryBuilder) queryTagCategories(query string, args []interface{}) (TagCategories, error) {
	var output TagCategories
	err := qb.dbi.RawQuery(tagCategoryDBTable, query, args, &output)
	return output, err
}

func (qb *TagCategoryQueryBuilder) FindByIds(ids []uuid.UUID) ([]*TagCategory, []error) {
	query := `
		SELECT tag_categories.* FROM tag_categories
		WHERE id IN (?)
	`
	query, args, _ := sqlx.In(query, ids)
	categories, err := qb.queryTagCategories(query, args)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*TagCategory)
	for _, category := range categories {
		m[category.ID] = category
	}

	result := make([]*TagCategory, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *TagCategoryQueryBuilder) Query(findFilter *QuerySpec) ([]*TagCategory, int, error) {
	if findFilter == nil {
		findFilter = &QuerySpec{}
	}

	query := database.NewQueryBuilder(tagCategoryDBTable)

	query.SortAndPagination = qb.getTagCategorySort(findFilter) + getPagination(findFilter)
	var categories TagCategories

	countResult, err := qb.dbi.Query(*query, &categories)

	if err != nil {
		return nil, 0, err
	}

	return categories, countResult, nil
}

func (qb *TagCategoryQueryBuilder) getTagCategorySort(findFilter *QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(sort, direction, tagCategoryTable)
}
