package sqlx

import (
	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	tagCategoryTable   = "tag_categories"
	tagCategoryJoinKey = "category_id"
)

var (
	tagCategoryDBTable = newTable(tagCategoryTable, func() interface{} {
		return &models.TagCategory{}
	})
)

type tagCategoryQueryBuilder struct {
	dbi *dbi
}

func newTagCategoryQueryBuilder(txn *txnState) models.TagCategoryRepo {
	return &tagCategoryQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *tagCategoryQueryBuilder) toModel(ro interface{}) *models.TagCategory {
	if ro != nil {
		return ro.(*models.TagCategory)
	}

	return nil
}

func (qb *tagCategoryQueryBuilder) Create(newCategory models.TagCategory) (*models.TagCategory, error) {
	ret, err := qb.dbi.Insert(tagCategoryDBTable, newCategory)
	return qb.toModel(ret), err
}

func (qb *tagCategoryQueryBuilder) Update(updatedCategory models.TagCategory) (*models.TagCategory, error) {
	ret, err := qb.dbi.Update(tagCategoryDBTable, updatedCategory, false)
	return qb.toModel(ret), err
}

func (qb *tagCategoryQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, tagCategoryDBTable)
}

func (qb *tagCategoryQueryBuilder) Find(id uuid.UUID) (*models.TagCategory, error) {
	ret, err := qb.dbi.Find(id, tagCategoryDBTable)
	return qb.toModel(ret), err
}

func (qb *tagCategoryQueryBuilder) queryTagCategories(query string, args []interface{}) (models.TagCategories, error) {
	var output models.TagCategories
	err := qb.dbi.RawQuery(tagCategoryDBTable, query, args, &output)
	return output, err
}

func (qb *tagCategoryQueryBuilder) FindByIds(ids []uuid.UUID) ([]*models.TagCategory, []error) {
	query := `
		SELECT tag_categories.* FROM tag_categories
		WHERE id IN (?)
	`
	query, args, _ := sqlx.In(query, ids)
	categories, err := qb.queryTagCategories(query, args)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*models.TagCategory)
	for _, category := range categories {
		m[category.ID] = category
	}

	result := make([]*models.TagCategory, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *tagCategoryQueryBuilder) Query(findFilter *models.QuerySpec) ([]*models.TagCategory, int, error) {
	if findFilter == nil {
		findFilter = &models.QuerySpec{}
	}

	query := newQueryBuilder(tagCategoryDBTable)

	query.SortAndPagination = qb.getTagCategorySort(findFilter) + getPagination(findFilter)
	var categories models.TagCategories

	countResult, err := qb.dbi.Query(*query, &categories)

	if err != nil {
		return nil, 0, err
	}

	return categories, countResult, nil
}

func (qb *tagCategoryQueryBuilder) getTagCategorySort(findFilter *models.QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(qb.dbi.txn.dialect, sort, direction, tagCategoryTable, nil)
}
