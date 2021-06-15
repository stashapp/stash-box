package sqlx

import (
	"encoding/json"
	"errors"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

const (
	editTable   = "edits"
	editJoinKey = "edit_id"

	//voteTable = "votes"
)

var (
	editDBTable = NewTable(editTable, func() interface{} {
		return &models.Edit{}
	})

	editTagTable = NewTableJoin(editTable, "tag_edits", editJoinKey, func() interface{} {
		return &models.EditTag{}
	})

	editPerformerTable = NewTableJoin(editTable, "performer_edits", editJoinKey, func() interface{} {
		return &models.EditPerformer{}
	})

	editCommentTable = NewTableJoin(editTable, "edit_comments", editJoinKey, func() interface{} {
		return &models.EditComment{}
	})

	// voteDBTable = database.NewTable(editTable, func() interface{} {
	// 	return &Edit{}
	// })
)

type editQueryBuilder struct {
	dbi *dbi
}

func newEditQueryBuilder(txn *txnState) models.EditRepo {
	return &editQueryBuilder{
		dbi: NewDBI(txn),
	}
}

func (qb *editQueryBuilder) toModel(ro interface{}) *models.Edit {
	if ro != nil {
		return ro.(*models.Edit)
	}

	return nil
}

func (qb *editQueryBuilder) Create(newEdit models.Edit) (*models.Edit, error) {
	ret, err := qb.dbi.Insert(editDBTable, newEdit)
	return qb.toModel(ret), err
}

func (qb *editQueryBuilder) Update(updatedEdit models.Edit) (*models.Edit, error) {
	ret, err := qb.dbi.Update(editDBTable, updatedEdit, false)
	return qb.toModel(ret), err
}

func (qb *editQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, editDBTable)
}

func (qb *editQueryBuilder) Find(id uuid.UUID) (*models.Edit, error) {
	ret, err := qb.dbi.Find(id, editDBTable)
	return qb.toModel(ret), err
}

func (qb *editQueryBuilder) CreateEditTag(newJoin models.EditTag) error {
	return qb.dbi.InsertJoin(editTagTable, newJoin, nil)
}

func (qb *editQueryBuilder) CreateEditPerformer(newJoin models.EditPerformer) error {
	return qb.dbi.InsertJoin(editPerformerTable, newJoin, nil)
}

func (qb *editQueryBuilder) FindTagID(id uuid.UUID) (*uuid.UUID, error) {
	joins := models.EditTags{}
	err := qb.dbi.FindJoins(editTagTable, id, &joins)
	if err != nil {
		return nil, err
	}
	if len(joins) == 0 {
		return nil, errors.New("tag edit not found")
	}
	return &joins[0].TagID, nil
}

func (qb *editQueryBuilder) FindPerformerID(id uuid.UUID) (*uuid.UUID, error) {
	joins := models.EditPerformers{}
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

func (qb *editQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT edits.id FROM edits"), nil)
}

func (qb *editQueryBuilder) Query(editFilter *models.EditFilterType, findFilter *models.QuerySpec) ([]*models.Edit, int) {
	if editFilter == nil {
		editFilter = &models.EditFilterType{}
	}
	if findFilter == nil {
		findFilter = &models.QuerySpec{}
	}

	query := NewQueryBuilder(editDBTable)

	if q := editFilter.UserID; q != nil && *q != "" {
		query.Eq(editDBTable.Name()+".user_id", *q)
	}

	if q := editFilter.TargetID; q != nil && *q != "" {
		if editFilter.TargetType == nil || *editFilter.TargetType == "" {
			panic("TargetType is required when TargetID filter is used")
		}
		if *editFilter.TargetType == "TAG" {
			query.AddJoin(editTagTable.Table, editTagTable.Name()+".edit_id = edits.id")
			query.AddWhere("(" + editTagTable.Name() + ".tag_id = ? OR " + editDBTable.Name() + ".data->'merge_sources' @> ?)")
			jsonID, _ := json.Marshal(*q)
			query.AddArg(*q, jsonID)
		} else if *editFilter.TargetType == "PERFORMER" {
			query.AddJoin(editPerformerTable.Table, editPerformerTable.Name()+".edit_id = edits.id")
			query.AddWhere("(" + editPerformerTable.Name() + ".performer_id = ? OR " + editDBTable.Name() + ".data->'merge_sources' @> ?)")
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

	var edits models.Edits
	countResult, err := qb.dbi.Query(*query, &edits)

	if err != nil {
		// TODO
		panic(err)
	}

	return edits, countResult
}

func (qb *editQueryBuilder) getEditSort(findFilter *models.QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "updated_at"
		direction = "DESC"
	} else {
		sort = findFilter.GetSort("updated_at")
		direction = findFilter.GetDirection()
	}
	return getSort(qb.dbi.txn.dialect, sort, direction, "edits", nil)
}

func (qb *editQueryBuilder) queryEdits(query string, args []interface{}) (models.Edits, error) {
	output := models.Edits{}
	err := qb.dbi.RawQuery(editDBTable, query, args, &output)
	return output, err
}

func (qb *editQueryBuilder) CreateComment(newJoin models.EditComment) error {
	return qb.dbi.InsertJoin(editCommentTable, newJoin, nil)
}

func (qb *editQueryBuilder) GetComments(id uuid.UUID) (models.EditComments, error) {
	joins := models.EditComments{}
	err := qb.dbi.FindJoins(editCommentTable, id, &joins)

	return joins, err
}

func (qb *editQueryBuilder) FindByTagID(id uuid.UUID) ([]*models.Edit, error) {
	query := `
        SELECT edits.* FROM edits
        JOIN tag_edits
        ON tag_edits.edit_id = edits.id
        WHERE tag_edits.tag_id = ?`
	args := []interface{}{id}
	return qb.queryEdits(query, args)
}

func (qb *editQueryBuilder) FindByPerformerID(id uuid.UUID) ([]*models.Edit, error) {
	query := `
        SELECT edits.* FROM edits
        JOIN performer_edits
        ON performer_edits.edit_id = edits.id
        WHERE performer_edits.performer_id = ?`
	args := []interface{}{id}
	return qb.queryEdits(query, args)
}
