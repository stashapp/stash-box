package models

import (
	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stashdb/pkg/database"
)

type EditQueryBuilder struct {
	dbi database.DBI
}

func NewEditQueryBuilder(tx *sqlx.Tx) EditQueryBuilder {
	return EditQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *EditQueryBuilder) toModel(ro interface{}) *Edit {
	if ro != nil {
		return ro.(*Edit)
	}

	return nil
}

func (qb *EditQueryBuilder) Create(newEdit Edit) (*Edit, error) {
	ret, err := qb.dbi.Insert(newEdit)
	return qb.toModel(ret), err
}

func (qb *EditQueryBuilder) Update(updatedEdit Edit) (*Edit, error) {
	ret, err := qb.dbi.Update(updatedEdit)
	return qb.toModel(ret), err
}

func (qb *EditQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, editDBTable)
}

func (qb *EditQueryBuilder) Find(id uuid.UUID) (*Edit, error) {
	ret, err := qb.dbi.Find(id, editDBTable)
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

// func (qb *SceneQueryBuilder) FindByChecksum(checksum string) (*Scene, error) {
// 	query := `SELECT scenes.* FROM scenes
// 		left join scene_checksums on scenes.id = scene_checksums.scene_id
// 		WHERE scene_checksums.checksum = ?`

// 	var args []interface{}
// 	args = append(args, checksum)

// 	results, err := qb.queryScenes(query, args)
// 	if err != nil || len(results) < 1 {
// 		return nil, err
// 	}
// 	return results[0], nil
// }

// func (qb *SceneQueryBuilder) FindByChecksums(checksums []string) ([]*Scene, error) {
// 	query := `SELECT scenes.* FROM scenes
// 		left join scene_checksums on scenes.id = scene_checksums.scene_id
// 		WHERE scene_checksums.checksum IN ` + getInBinding(len(checksums))

// 	var args []interface{}
// 	for _, name := range checksums {
// 		args = append(args, name)
// 	}
// 	return qb.queryScenes(query, args)
// }

func (qb *EditQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT edits.id FROM edits"), nil)
}

func (qb *EditQueryBuilder) Query(editFilter *EditFilterType, findFilter *QuerySpec) ([]*Edit, int) {
	if editFilter == nil {
		editFilter = &EditFilterType{}
	}
	if findFilter == nil {
		findFilter = &QuerySpec{}
	}

	query := database.NewQueryBuilder(editDBTable)

	if q := editFilter.UserID; q != nil && *q != "" {
		query.AddWhere("edits.user_id = ?")
		query.AddArg(*q)
	}

	if q := editFilter.Applied; q != nil {
		query.AddWhere("edits.applied = ?")
		query.AddArg(*q)
	}

	// TODO - other filters

	query.SortAndPagination = qb.getEditSort(findFilter) + getPagination(findFilter)

	var edits Edits
	countResult, err := qb.dbi.Query(*query, &edits)

	if err != nil {
		// TODO
		panic(err)
	}

	return edits, countResult
}

func (qb *EditQueryBuilder) getEditSort(findFilter *QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "updated_at"
		direction = "DESC"
	} else {
		sort = findFilter.GetSort("updated_at")
		direction = findFilter.GetDirection()
	}
	return getSort(sort, direction, "edits")
}

func (qb *EditQueryBuilder) queryEdits(query string, args []interface{}) (Edits, error) {
	output := Edits{}
	err := qb.dbi.RawQuery(editDBTable, query, args, &output)
	return output, err
}
