package models

import (
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stashdb/pkg/database"
)

type SceneQueryBuilder struct {
	dbi database.DBI
}

func NewSceneQueryBuilder(tx *sqlx.Tx) SceneQueryBuilder {
	return SceneQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *SceneQueryBuilder) toModel(ro interface{}) *Scene {
	if ro != nil {
		return ro.(*Scene)
	}

	return nil
}

func (qb *SceneQueryBuilder) Create(newScene Scene) (*Scene, error) {
	ret, err := qb.dbi.Insert(newScene)
	return qb.toModel(ret), err
}

func (qb *SceneQueryBuilder) Update(updatedScene Scene) (*Scene, error) {
	ret, err := qb.dbi.Update(updatedScene)
	return qb.toModel(ret), err
}

func (qb *SceneQueryBuilder) Destroy(id int64) error {
	return qb.dbi.Delete(id, sceneDBTable)
}

func (qb *SceneQueryBuilder) CreateChecksums(newJoins SceneChecksums) error {
	return qb.dbi.InsertJoins(sceneChecksumTable, &newJoins)
}

func (qb *SceneQueryBuilder) UpdateChecksums(sceneID int64, updatedJoins SceneChecksums) error {
	return qb.dbi.ReplaceJoins(sceneChecksumTable, sceneID, &updatedJoins)
}

func (qb *SceneQueryBuilder) Find(id int64) (*Scene, error) {
	ret, err := qb.dbi.Find(id, sceneDBTable)
	return qb.toModel(ret), err
}

// func (qb *SceneQueryBuilder) FindByStudioID(sceneID int) ([]*Scene, error) {
// 	query := `
// 		SELECT scenes.* FROM scenes
// 		LEFT JOIN scenes_scenes as scenes_join on scenes_join.scene_id = scenes.id
// 		LEFT JOIN scenes on scenes_join.scene_id = scenes.id
// 		WHERE scenes.id = ?
// 		GROUP BY scenes.id
// 	`
// 	args := []interface{}{sceneID}
// 	return qb.queryScenes(query, args)
// }

func (qb *SceneQueryBuilder) FindByChecksum(checksum string) (*Scene, error) {
	query := `SELECT scenes.* FROM scenes
		left join scene_checksums on scenes.id = scene_checksums.scene_id
		WHERE scene_checksums.checksum = ?`

	var args []interface{}
	args = append(args, checksum)

	results, err := qb.queryScenes(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *SceneQueryBuilder) FindByChecksums(checksums []string) ([]*Scene, error) {
	query := `SELECT scenes.* FROM scenes
		left join scene_checksums on scenes.id = scene_checksums.scene_id
		WHERE scene_checksums.checksum IN ` + getInBinding(len(checksums))

	var args []interface{}
	for _, name := range checksums {
		args = append(args, name)
	}
	return qb.queryScenes(query, args)
}

func (qb *SceneQueryBuilder) FindByTitle(name string) ([]*Scene, error) {
	query := "SELECT * FROM scenes WHERE upper(title) = upper(?)"
	var args []interface{}
	args = append(args, name)
	return qb.queryScenes(query, args)
}

func (qb *SceneQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT scenes.id FROM scenes"), nil)
}

func (qb *SceneQueryBuilder) Query(sceneFilter *SceneFilterType, findFilter *QuerySpec) ([]*Scene, int) {
	if sceneFilter == nil {
		sceneFilter = &SceneFilterType{}
	}
	if findFilter == nil {
		findFilter = &QuerySpec{}
	}

	query := queryBuilder{
		tableName: sceneTable,
	}

	query.body = selectDistinctIDs(sceneTable)

	if q := sceneFilter.Text; q != nil && *q != "" {
		searchColumns := []string{"scenes.title", "scenes.details"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false)
		query.addWhere(clause)
		query.addArg(thisArgs...)
	}

	if q := sceneFilter.Title; q != nil && *q != "" {
		searchColumns := []string{"scenes.title"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false)
		query.addWhere(clause)
		query.addArg(thisArgs...)
	}

	if q := sceneFilter.URL; q != nil && *q != "" {
		searchColumns := []string{"scenes.url"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false)
		query.addWhere(clause)
		query.addArg(thisArgs...)
	}

	// TODO - other filters

	query.sortAndPagination = qb.getSceneSort(findFilter) + getPagination(findFilter)
	idsResult, countResult := query.executeFind()

	var scenes []*Scene
	for _, id := range idsResult {
		scene, _ := qb.Find(id)
		scenes = append(scenes, scene)
	}

	return scenes, countResult
}

func (qb *SceneQueryBuilder) getSceneSort(findFilter *QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "title"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("title")
		direction = findFilter.GetDirection()
	}
	return getSort(sort, direction, "scenes")
}

func (qb *SceneQueryBuilder) queryScenes(query string, args []interface{}) (Scenes, error) {
	output := Scenes{}
	err := qb.dbi.RawQuery(sceneDBTable, query, args, &output)
	return output, err
}

func (qb *SceneQueryBuilder) GetChecksums(id int64) ([]string, error) {
	joins := SceneChecksums{}
	err := qb.dbi.FindJoins(sceneChecksumTable, id, &joins)

	return joins.ToChecksums(), err
}

func (qb *SceneQueryBuilder) GetPerformers(id int64) (PerformersScenes, error) {
	joins := PerformersScenes{}
	err := qb.dbi.FindJoins(scenePerformerTable, id, &joins)

	return joins, err
}
