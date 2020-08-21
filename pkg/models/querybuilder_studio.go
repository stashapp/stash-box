package models

import (
	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/utils"
)

type StudioQueryBuilder struct {
	dbi database.DBI
}

func NewStudioQueryBuilder(tx *sqlx.Tx) StudioQueryBuilder {
	return StudioQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *StudioQueryBuilder) toModel(ro interface{}) *Studio {
	if ro != nil {
		return ro.(*Studio)
	}

	return nil
}

func (qb *StudioQueryBuilder) Create(newStudio Studio) (*Studio, error) {
	ret, err := qb.dbi.Insert(newStudio)
	return qb.toModel(ret), err
}

func (qb *StudioQueryBuilder) Update(updatedStudio Studio) (*Studio, error) {
	ret, err := qb.dbi.Update(updatedStudio, false)
	return qb.toModel(ret), err
}

func (qb *StudioQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, studioDBTable)
}

func (qb *StudioQueryBuilder) CreateUrls(newJoins StudioUrls) error {
	return qb.dbi.InsertJoins(studioUrlTable, &newJoins)
}

func (qb *StudioQueryBuilder) UpdateUrls(studioID uuid.UUID, updatedJoins StudioUrls) error {
	return qb.dbi.ReplaceJoins(studioUrlTable, studioID, &updatedJoins)
}

func (qb *StudioQueryBuilder) Find(id uuid.UUID) (*Studio, error) {
	ret, err := qb.dbi.Find(id, studioDBTable)
	return qb.toModel(ret), err
}

func (qb *StudioQueryBuilder) FindBySceneID(sceneID int) (Studios, error) {
	query := `
		SELECT studios.* FROM studios
		LEFT JOIN scenes on scenes.studio_id = studios.id
		WHERE scenes.id = ?
		GROUP BY studios.id
	`
	args := []interface{}{sceneID}
	return qb.queryStudios(query, args)
}

func (qb *StudioQueryBuilder) FindByNames(names []string) (Studios, error) {
	query := "SELECT * FROM studios WHERE name IN " + getInBinding(len(names))
	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryStudios(query, args)
}

func (qb *StudioQueryBuilder) FindByName(name string) (*Studio, error) {
	query := "SELECT * FROM studios WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	results, err := qb.queryStudios(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *StudioQueryBuilder) FindByParentID(id uuid.UUID) (Studios, error) {
	query := "SELECT * FROM studios WHERE parent_studio_id = ?"
	var args []interface{}
	args = append(args, id)
	return qb.queryStudios(query, args)
}

func (qb *StudioQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT studios.id FROM studios"), nil)
}

func (qb *StudioQueryBuilder) Query(studioFilter *StudioFilterType, findFilter *QuerySpec) (Studios, int) {
	if studioFilter == nil {
		studioFilter = &StudioFilterType{}
	}
	if findFilter == nil {
		findFilter = &QuerySpec{}
	}

	query := database.NewQueryBuilder(studioDBTable)

	if q := studioFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"studios.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, false)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	query.SortAndPagination = qb.getStudioSort(findFilter) + getPagination(findFilter)
	var studios Studios
	countResult, err := qb.dbi.Query(*query, &studios)

	if err != nil {
		// TODO
		panic(err)
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

func (qb *StudioQueryBuilder) queryStudios(query string, args []interface{}) (Studios, error) {
	var output Studios
	err := qb.dbi.RawQuery(studioDBTable, query, args, &output)
	return output, err
}

func (qb *StudioQueryBuilder) GetUrls(id uuid.UUID) (StudioUrls, error) {
	joins := StudioUrls{}
	err := qb.dbi.FindJoins(studioUrlTable, id, &joins)

	return joins, err
}

func (qb *StudioQueryBuilder) GetAllUrls(ids []uuid.UUID) ([][]*URL, []error) {
	joins := StudioUrls{}
	err := qb.dbi.FindAllJoins(studioUrlTable, ids, &joins)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]*URL)
	for _, join := range joins {
		url := URL{
			URL:  join.URL,
			Type: join.Type,
		}
		m[join.StudioID] = append(m[join.StudioID], &url)
	}

	result := make([][]*URL, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}
