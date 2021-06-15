package sqlx

import (
	"database/sql"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	studioTable   = "studios"
	studioJoinKey = "studio_id"
)

var (
	studioDBTable = NewTable(studioTable, func() interface{} {
		return &models.Studio{}
	})

	studioURLTable = NewTableJoin(studioTable, "studio_urls", studioJoinKey, func() interface{} {
		return &models.StudioURL{}
	})
)

type studioQueryBuilder struct {
	dbi *dbi
}

func newStudioQueryBuilder(txn *txnState) models.StudioRepo {
	return &studioQueryBuilder{
		dbi: NewDBI(txn),
	}
}

func (qb *studioQueryBuilder) toModel(ro interface{}) *models.Studio {
	if ro != nil {
		return ro.(*models.Studio)
	}

	return nil
}

func (qb *studioQueryBuilder) Create(newStudio models.Studio) (*models.Studio, error) {
	ret, err := qb.dbi.Insert(studioDBTable, newStudio)
	return qb.toModel(ret), err
}

func (qb *studioQueryBuilder) Update(updatedStudio models.Studio) (*models.Studio, error) {
	ret, err := qb.dbi.Update(studioDBTable, updatedStudio, true)
	return qb.toModel(ret), err
}

func (qb *studioQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, studioDBTable)
}

func (qb *studioQueryBuilder) CreateURLs(newJoins models.StudioURLs) error {
	return qb.dbi.InsertJoins(studioURLTable, &newJoins)
}

func (qb *studioQueryBuilder) UpdateURLs(studioID uuid.UUID, updatedJoins models.StudioURLs) error {
	return qb.dbi.ReplaceJoins(studioURLTable, studioID, &updatedJoins)
}

func (qb *studioQueryBuilder) Find(id uuid.UUID) (*models.Studio, error) {
	ret, err := qb.dbi.Find(id, studioDBTable)
	return qb.toModel(ret), err
}

func (qb *studioQueryBuilder) FindBySceneID(sceneID int) (models.Studios, error) {
	query := `
		SELECT studios.* FROM studios
		LEFT JOIN scenes on scenes.studio_id = studios.id
		WHERE scenes.id = ?
		GROUP BY studios.id
	`
	args := []interface{}{sceneID}
	return qb.queryStudios(query, args)
}

func (qb *studioQueryBuilder) FindByNames(names []string) (models.Studios, error) {
	query := "SELECT * FROM studios WHERE name IN " + getInBinding(len(names))
	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryStudios(query, args)
}

func (qb *studioQueryBuilder) FindByName(name string) (*models.Studio, error) {
	query := "SELECT * FROM studios WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	results, err := qb.queryStudios(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *studioQueryBuilder) FindByParentID(id uuid.UUID) (models.Studios, error) {
	query := "SELECT * FROM studios WHERE parent_studio_id = ?"
	var args []interface{}
	args = append(args, id)
	return qb.queryStudios(query, args)
}

func (qb *studioQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT studios.id FROM studios"), nil)
}

func (qb *studioQueryBuilder) Query(studioFilter *models.StudioFilterType, findFilter *models.QuerySpec) (models.Studios, int) {
	if studioFilter == nil {
		studioFilter = &models.StudioFilterType{}
	}
	if findFilter == nil {
		findFilter = &models.QuerySpec{}
	}

	query := NewQueryBuilder(studioDBTable)
	query.Body += "LEFT JOIN studios as parent_studio ON studios.parent_studio_id = parent_studio.id"

	if q := studioFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"studios.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if q := studioFilter.Names; q != nil && *q != "" {
		searchColumns := []string{"studios.name", "parent_studio.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if studioFilter.HasParent != nil {
		if *studioFilter.HasParent {
			query.AddWhere("parent_studio.id IS NOT NULL")
		} else {
			query.AddWhere("parent_studio.id IS NULL")
		}
	}

	query.SortAndPagination = qb.getStudioSort(findFilter) + getPagination(findFilter)
	var studios models.Studios
	countResult, err := qb.dbi.Query(*query, &studios)

	if err != nil {
		// TODO
		panic(err)
	}

	return studios, countResult
}

func (qb *studioQueryBuilder) getStudioSort(findFilter *models.QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(qb.dbi.txn.dialect, sort, direction, "studios", nil)
}

func (qb *studioQueryBuilder) queryStudios(query string, args []interface{}) (models.Studios, error) {
	var output models.Studios
	err := qb.dbi.RawQuery(studioDBTable, query, args, &output)
	return output, err
}

func (qb *studioQueryBuilder) GetURLs(id uuid.UUID) (models.StudioURLs, error) {
	joins := models.StudioURLs{}
	err := qb.dbi.FindJoins(studioURLTable, id, &joins)

	return joins, err
}

func (qb *studioQueryBuilder) GetAllURLs(ids []uuid.UUID) ([][]*models.URL, []error) {
	joins := models.StudioURLs{}
	err := qb.dbi.FindAllJoins(studioURLTable, ids, &joins)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]*models.URL)
	for _, join := range joins {
		url := models.URL{
			URL:  join.URL,
			Type: join.Type,
		}
		m[join.StudioID] = append(m[join.StudioID], &url)
	}

	result := make([][]*models.URL, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *studioQueryBuilder) CountByPerformer(performerID uuid.UUID) ([]*models.PerformerStudio, error) {
	var results []*models.PerformerStudio

	query := `
		SELECT S.*, C.count
		FROM studios S JOIN (
			SELECT studio_id, COUNT(*)
			FROM scene_performers SP
			JOIN scenes S ON SP.scene_id = S.id
			WHERE performer_id = ?
			GROUP BY studio_id
		) C ON S.id = C.studio_id`
	query = qb.dbi.db().Rebind(query)
	if err := qb.dbi.db().Select(&results, query, performerID); err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	return results, nil
}
