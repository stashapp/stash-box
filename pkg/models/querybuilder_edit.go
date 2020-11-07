package models

import (
	"encoding/json"
	"errors"

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
	ret, err := qb.dbi.Update(updatedEdit, false)
	return qb.toModel(ret), err
}

func (qb *EditQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, editDBTable)
}

func (qb *EditQueryBuilder) Find(id uuid.UUID) (*Edit, error) {
	ret, err := qb.dbi.Find(id, editDBTable)
	return qb.toModel(ret), err
}

func (qb *EditQueryBuilder) CreateEditTag(newJoin EditTag) error {
	return qb.dbi.InsertJoin(editTagTable, newJoin, false)
}

func (qb *EditQueryBuilder) CreateEditPerformer(newJoin EditPerformer) error {
	return qb.dbi.InsertJoin(editPerformerTable, newJoin, false)
}

func (qb *EditQueryBuilder) FindTagID(id uuid.UUID) (*uuid.UUID, error) {
	joins := EditTags{}
	err := qb.dbi.FindJoins(editTagTable, id, &joins)
	if err != nil {
		return nil, err
	}
	if len(joins) == 0 {
		return nil, errors.New("tag edit not found")
	}
	return &joins[0].TagID, nil
}

func (qb *EditQueryBuilder) FindPerformerID(id uuid.UUID) (*uuid.UUID, error) {
	joins := EditPerformers{}
	err := qb.dbi.FindJoins(editPerformerTable, id, &joins)
	if err != nil {
		return nil, err
	}
	if len(joins) == 0 {
		return nil, errors.New("performer edit not found")
	}
	return &joins[0].PerformerID, nil
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
		query.Eq("scenes.user_id", *q)
	}

	if q := editFilter.TargetID; q != nil && *q != "" {
		if editFilter.TargetType == nil || *editFilter.TargetType == "" {
			panic("TargetType is required when TargetID filter is used")
		}
		if *editFilter.TargetType == "TAG" {
			query.AddJoin(editTagTable.Table, editTagTable.Name()+".edit_id = edits.id")
			query.AddWhere(editTagTable.Name() + ".tag_id = ? OR " + editDBTable.Name() + ".data->'merge_sources' @> ?")
			jsonID, _ := json.Marshal(*q)
			query.AddArg(*q, jsonID)
		} else if *editFilter.TargetType == "PERFORMER" {
			query.AddJoin(editPerformerTable.Table, editPerformerTable.Name()+".edit_id = edits.id")
			query.AddWhere(editPerformerTable.Name() + ".performer_id = ? OR " + editDBTable.Name() + ".data->'merge_sources' @> ?")
			jsonID, _ := json.Marshal(*q)
			query.AddArg(*q, jsonID)
		} else {
			panic("TargetType is not yet supported: " + *editFilter.TargetType)
		}
	} else if q := editFilter.TargetType; q != nil && *q != "" {
		query.Eq("target_type", q.String())
	}

	if q := editFilter.Status; q != nil {
		query.Eq("status", q.String())
	}
	if q := editFilter.Operation; q != nil {
		query.Eq("operation", q.String())
	}
	if q := editFilter.Applied; q != nil {
		query.Eq("applied", *q)
	}

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

func (qb *EditQueryBuilder) CreateComment(newJoin EditComment) error {
	return qb.dbi.InsertJoin(editCommentTable, newJoin, false)
}

func (qb *EditQueryBuilder) GetComments(id uuid.UUID) (EditComments, error) {
	joins := EditComments{}
	err := qb.dbi.FindJoins(editCommentTable, id, &joins)

	return joins, err
}

func (qb *EditQueryBuilder) FindByTagID(id uuid.UUID) ([]*Edit, error) {
	query := `
        SELECT edits.* FROM edits
        JOIN tag_edits
        ON tag_edits.edit_id = edits.id
        WHERE tag_edits.tag_id = ?`
	args := []interface{}{id}
	return qb.queryEdits(query, args)
}

func (qb *EditQueryBuilder) FindByPerformerID(id uuid.UUID) ([]*Edit, error) {
	query := `
        SELECT edits.* FROM edits
        JOIN performer_edits
        ON performer_edits.edit_id = edits.id
        WHERE performer_edits.performer_id = ?`
	args := []interface{}{id}
	return qb.queryEdits(query, args)
}
