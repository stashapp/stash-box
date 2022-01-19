package sqlx

import (
	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	siteTable = "sites"
)

var (
	siteDBTable = newTable(siteTable, func() interface{} {
		return &models.Site{}
	})
)

type siteQueryBuilder struct {
	dbi *dbi
}

func newSiteQueryBuilder(txn *txnState) models.SiteRepo {
	return &siteQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *siteQueryBuilder) toModel(ro interface{}) *models.Site {
	if ro != nil {
		return ro.(*models.Site)
	}

	return nil
}

func (qb *siteQueryBuilder) Create(newSite models.Site) (*models.Site, error) {
	ret, err := qb.dbi.Insert(siteDBTable, newSite)
	return qb.toModel(ret), err
}

func (qb *siteQueryBuilder) Update(updatedSite models.Site) (*models.Site, error) {
	ret, err := qb.dbi.Update(siteDBTable, updatedSite, false)
	return qb.toModel(ret), err
}

func (qb *siteQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, siteDBTable)
}

func (qb *siteQueryBuilder) Find(id uuid.UUID) (*models.Site, error) {
	ret, err := qb.dbi.Find(id, siteDBTable)
	return qb.toModel(ret), err
}

func (qb *siteQueryBuilder) querySites(query string, args []interface{}) (models.Sites, error) {
	var output models.Sites
	err := qb.dbi.RawQuery(siteDBTable, query, args, &output)
	return output, err
}

func (qb *siteQueryBuilder) FindByIds(ids []uuid.UUID) ([]*models.Site, []error) {
	query := `
		SELECT sites.* FROM sites
		WHERE id IN (?)
	`
	query, args, _ := sqlx.In(query, ids)
	sites, err := qb.querySites(query, args)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*models.Site)
	for _, site := range sites {
		m[site.ID] = site
	}

	result := make([]*models.Site, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *siteQueryBuilder) Query(findFilter *models.QuerySpec) ([]*models.Site, int, error) {
	if findFilter == nil {
		findFilter = &models.QuerySpec{}
	}

	query := newQueryBuilder(siteDBTable)

	query.Sort = qb.getSiteSort(findFilter)
	query.Pagination = getPagination(findFilter)
	var sites models.Sites

	countResult, err := qb.dbi.Query(*query, &sites)

	if err != nil {
		return nil, 0, err
	}

	return sites, countResult, nil
}

func (qb *siteQueryBuilder) getSiteSort(findFilter *models.QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(qb.dbi.txn.dialect, sort, direction, siteTable, nil)
}
