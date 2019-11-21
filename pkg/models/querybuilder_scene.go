package models

import (
	"database/sql"

	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
	"github.com/stashapp/stashdb/pkg/database"
)

type SceneQueryBuilder struct{}

const sceneTable = "scenes"
const sceneChecksumsJoinTable = "scene_checksums"
const sceneJoinKey = "scene_id"

func NewSceneQueryBuilder() SceneQueryBuilder {
	return SceneQueryBuilder{}
}

func (qb *SceneQueryBuilder) Create(newScene Scene, tx *sqlx.Tx) (*Scene, error) {
	sceneID, err := insertObject(tx, sceneTable, newScene)

	if err != nil {
		return nil, errors.Wrap(err, "Error creating scene")
	}

	if err := getByID(tx, sceneTable, sceneID, &newScene); err != nil {
		return nil, errors.Wrap(err, "Error getting scene after create")
	}
	return &newScene, nil
}

func (qb *SceneQueryBuilder) Update(updatedScene Scene, tx *sqlx.Tx) (*Scene, error) {
	err := updateObjectByID(tx, sceneTable, updatedScene)

	if err != nil {
		return nil, errors.Wrap(err, "Error updating scene")
	}

	if err := getByID(tx, sceneTable, updatedScene.ID, &updatedScene); err != nil {
		return nil, errors.Wrap(err, "Error getting scene after update")
	}
	return &updatedScene, nil
}

func (qb *SceneQueryBuilder) Destroy(id int64, tx *sqlx.Tx) error {
	return executeDeleteQuery(sceneTable, id, tx)
}

func (qb *SceneQueryBuilder) CreateChecksums(newJoins []SceneChecksum, tx *sqlx.Tx) error {
	return insertJoins(tx, sceneChecksumsJoinTable, newJoins)
}

func (qb *SceneQueryBuilder) UpdateChecksums(sceneID int64, updatedJoins []SceneChecksum, tx *sqlx.Tx) error {
	ensureTx(tx)

	// Delete the existing joins and then create new ones
	err := deleteObjectsByColumn(tx, sceneChecksumsJoinTable, sceneJoinKey, sceneID)
	if err != nil {
		return err
	}
	return qb.CreateChecksums(updatedJoins, tx)
}

func (qb *SceneQueryBuilder) Find(id int64) (*Scene, error) {
	query := "SELECT * FROM scenes WHERE id = ? LIMIT 1"
	args := []interface{}{id}
	results, err := qb.queryScenes(query, args, nil)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

// func (qb *SceneQueryBuilder) FindByStudioID(sceneID int, tx *sqlx.Tx) ([]*Scene, error) {
// 	query := `
// 		SELECT scenes.* FROM scenes
// 		LEFT JOIN scenes_scenes as scenes_join on scenes_join.scene_id = scenes.id
// 		LEFT JOIN scenes on scenes_join.scene_id = scenes.id
// 		WHERE scenes.id = ?
// 		GROUP BY scenes.id
// 	`
// 	args := []interface{}{sceneID}
// 	return qb.queryScenes(query, args, tx)
// }

func (qb *SceneQueryBuilder) FindByChecksum(checksum string, tx *sqlx.Tx) (*Scene, error) {
	query := `SELECT scenes.* FROM scenes
		left join scene_checksums on scenes.id = scene_checksums.scene_id
		WHERE scene_checksums.checksum = ?`

	var args []interface{}
	args = append(args, checksum)

	results, err := qb.queryScenes(query, args, tx)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *SceneQueryBuilder) FindByChecksums(checksums []string, tx *sqlx.Tx) ([]*Scene, error) {
	query := `SELECT scenes.* FROM scenes
		left join scene_checksums on scenes.id = scene_checksums.scene_id
		WHERE scene_checksums.checksum IN ` + getInBinding(len(checksums))

	var args []interface{}
	for _, name := range checksums {
		args = append(args, name)
	}
	return qb.queryScenes(query, args, tx)
}

func (qb *SceneQueryBuilder) FindByTitle(name string, tx *sqlx.Tx) ([]*Scene, error) {
	query := "SELECT * FROM scenes WHERE upper(title) = upper(?)"
	var args []interface{}
	args = append(args, name)
	return qb.queryScenes(query, args, tx)
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

func (qb *SceneQueryBuilder) queryScenes(query string, args []interface{}, tx *sqlx.Tx) ([]*Scene, error) {
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

	scenes := make([]*Scene, 0)
	for rows.Next() {
		scene := Scene{}
		if err := rows.StructScan(&scene); err != nil {
			return nil, err
		}
		scenes = append(scenes, &scene)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return scenes, nil
}

func (qb *SceneQueryBuilder) GetChecksums(id int64) ([]string, error) {
	query := "SELECT checksum FROM scene_checksums WHERE scene_id = ?"
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
