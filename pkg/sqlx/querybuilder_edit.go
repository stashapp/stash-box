package sqlx

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

const (
	editTable          = "edits"
	editJoinKey        = "edit_id"
	performerEditTable = "performer_edits"
	tagEditTable       = "tag_edits"
	studioEditTable    = "studio_edits"
	sceneEditTable     = "scene_edits"
	commentTable       = "edit_comments"
	voteTable          = "edit_votes"
)

var ErrEditTargetIDNotFound = fmt.Errorf("edit target not found")

var (
	editDBTable = newTable(editTable, func() interface{} {
		return &models.Edit{}
	})

	editTagTable = newTableJoin(editTable, tagEditTable, editJoinKey, func() interface{} {
		return &models.EditTag{}
	})

	editPerformerTable = newTableJoin(editTable, performerEditTable, editJoinKey, func() interface{} {
		return &models.EditPerformer{}
	})

	editStudioTable = newTableJoin(editTable, studioEditTable, editJoinKey, func() interface{} {
		return &models.EditStudio{}
	})

	editSceneTable = newTableJoin(editTable, sceneEditTable, editJoinKey, func() interface{} {
		return &models.EditScene{}
	})

	editCommentTable = newTableJoin(editTable, commentTable, editJoinKey, func() interface{} {
		return &models.EditComment{}
	})

	editVoteTable = newTableJoin(editTable, voteTable, editJoinKey, func() interface{} {
		return &models.EditVote{}
	})
)

type editQueryBuilder struct {
	dbi *dbi
}

func newEditQueryBuilder(txn *txnState) models.EditRepo {
	return &editQueryBuilder{
		dbi: newDBI(txn),
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

func (qb *editQueryBuilder) CreateEditStudio(newJoin models.EditStudio) error {
	return qb.dbi.InsertJoin(editStudioTable, newJoin, nil)
}

func (qb *editQueryBuilder) CreateEditScene(newJoin models.EditScene) error {
	return qb.dbi.InsertJoin(editSceneTable, newJoin, nil)
}

func (qb *editQueryBuilder) FindTagID(id uuid.UUID) (*uuid.UUID, error) {
	joins := models.EditTags{}
	err := qb.dbi.FindJoins(editTagTable, id, &joins)
	if err != nil {
		return nil, err
	}
	if len(joins) == 0 {
		return nil, ErrEditTargetIDNotFound
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
		return nil, ErrEditTargetIDNotFound
	}
	return &joins[0].PerformerID, nil
}

func (qb *editQueryBuilder) FindStudioID(id uuid.UUID) (*uuid.UUID, error) {
	joins := models.EditStudios{}
	err := qb.dbi.FindJoins(editStudioTable, id, &joins)
	if err != nil {
		return nil, err
	}
	if len(joins) == 0 {
		return nil, ErrEditTargetIDNotFound
	}
	return &joins[0].StudioID, nil
}

func (qb *editQueryBuilder) FindSceneID(id uuid.UUID) (*uuid.UUID, error) {
	joins := models.EditScenes{}
	err := qb.dbi.FindJoins(editSceneTable, id, &joins)
	if err != nil {
		return nil, err
	}
	if len(joins) == 0 {
		return nil, ErrEditTargetIDNotFound
	}
	return &joins[0].SceneID, nil
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

func (qb *editQueryBuilder) buildQuery(filter models.EditQueryInput, userID uuid.UUID) (*queryBuilder, error) {
	query := newQueryBuilder(editDBTable)

	if q := filter.UserID; q != nil {
		query.Eq(editDBTable.Name()+".user_id", *q)
	}

	if targetID := filter.TargetID; targetID != nil {
		if filter.TargetType == nil || *filter.TargetType == "" {
			return nil, errors.New("TargetType is required when TargetID filter is used")
		}
		switch *filter.TargetType {
		case models.TargetTypeEnumTag:
			query.AddJoin(editTagTable.table, editTagTable.Name()+".edit_id = edits.id", false)
			query.AddWhere("(" + editTagTable.Name() + ".tag_id = ? OR " + editDBTable.Name() + ".data->'merge_sources' @> ?)")
		case models.TargetTypeEnumPerformer:
			query.AddJoin(editPerformerTable.table, editPerformerTable.Name()+".edit_id = edits.id", false)
			query.AddWhere("(" + editPerformerTable.Name() + ".performer_id = ? OR " + editDBTable.Name() + ".data->'merge_sources' @> ?)")
		case models.TargetTypeEnumStudio:
			query.AddJoin(editStudioTable.table, editStudioTable.Name()+".edit_id = edits.id", false)
			query.AddWhere("(" + editStudioTable.Name() + ".studio_id = ? OR " + editDBTable.Name() + ".data->'merge_sources' @> ?)")
		case models.TargetTypeEnumScene:
			query.AddJoin(editSceneTable.table, editSceneTable.Name()+".edit_id = edits.id", false)
			query.AddWhere("(" + editSceneTable.Name() + ".scene_id = ? OR " + editDBTable.Name() + ".data->'merge_sources' @> ?)")
		}
		jsonID, _ := json.Marshal(*targetID)
		query.AddArg(*targetID, jsonID)
	} else if q := filter.TargetType; q != nil && *q != "" {
		query.Eq("target_type", q.String())
	}

	if q := filter.Status; q != nil {
		query.Eq("status", q.String())
	}
	if q := filter.Operation; q != nil {
		query.Eq("operation", q.String())
	}
	if q := filter.Applied; q != nil {
		query.Eq("applied", *q)
	}

	if q := filter.IsFavorite; q != nil && *q {
		q := `
			(edits.id IN (
			 -- Edits on studio
			 (SELECT TE.edit_id FROM studio_favorites TF JOIN studio_edits TE ON TF.studio_id = TE.studio_id WHERE TF.user_id = ?)
			 UNION
			 -- Edits on performer
			 (SELECT PE.edit_id FROM performer_favorites PF JOIN performer_edits PE ON PF.performer_id = PE.performer_id WHERE PF.user_id = ?)
			 UNION
			 -- Edits on scene currently set to studio
			 (SELECT SE.edit_id FROM studio_favorites TF JOIN scenes S ON TF.studio_id = S.studio_id JOIN scene_edits SE ON S.id = SE.scene_id WHERE TF.user_id = ?)
			 UNION
			 -- Edits that merge performer
			 (SELECT E.id FROM performer_favorites PF JOIN edits E
			 ON E.data->'merge_sources' @> to_jsonb(PF.performer_id::TEXT)
			 WHERE E.target_type = 'PERFORMER' AND E.operation = 'MERGE'
			 AND PF.user_id = ?)
			 UNION
			 -- Edits that add/remove performer to scene
			 (SELECT E.id FROM performer_favorites PF JOIN edits E
			 ON jsonb_path_query_array(E.data, '$.new_data.added_performers[*].performer_id') @> to_jsonb(PF.performer_id::TEXT)
			 OR jsonb_path_query_array(E.data, '$.new_data.removed_performers[*].performer_id') @> to_jsonb(PF.performer_id::TEXT)
			 WHERE E.target_type = 'SCENE'
			 AND PF.user_id = ?)
			 UNION
			 -- Edits that add/remove studio from scene
			 (SELECT E.id FROM studio_favorites TF JOIN edits E
			 ON data->'new_data'->>'studio_id' = TF.studio_id::TEXT
			 OR data->'old_data'->>'studio_id' = TF.studio_id::TEXT
			 WHERE E.target_type = 'SCENE'
			 AND TF.user_id = ?)
			))
		`
		query.AddWhere(q)
		query.AddArg(userID, userID, userID, userID, userID, userID)
	}

	if filter.Sort == models.EditSortEnumClosedAt || filter.Sort == models.EditSortEnumUpdatedAt {
		// When closed_at/updated_at value is null, fallback to created_at
		colName := getColumn(editTable, filter.Sort.String())
		createdAtCol := getColumn(editTable, models.EditSortEnumCreatedAt.String())
		direction := getSortDirection(filter.Direction.String())
		query.Sort = " ORDER BY COALESCE(" + colName + ", " + createdAtCol + ") " + direction + nullsLast() +
			", " + getColumn(editTable, "id") + " " + direction
	} else {
		secondary := "id"
		query.Sort = getSort(filter.Sort.String(), filter.Direction.String(), "edits", &secondary)
	}

	return query, nil
}

func (qb *editQueryBuilder) QueryEdits(filter models.EditQueryInput, userID uuid.UUID) ([]*models.Edit, error) {
	query, err := qb.buildQuery(filter, userID)
	if err != nil {
		return nil, err
	}
	query.Pagination = getPagination(filter.Page, filter.PerPage)

	var edits models.Edits
	err = qb.dbi.QueryOnly(*query, &edits)

	return edits, err
}

func (qb *editQueryBuilder) QueryCount(filter models.EditQueryInput, userID uuid.UUID) (int, error) {
	query, err := qb.buildQuery(filter, userID)
	if err != nil {
		return 0, err
	}
	return qb.dbi.CountOnly(*query)
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

func (qb *editQueryBuilder) CreateVote(newJoin models.EditVote) error {
	conflictHandling := `
		ON CONFLICT(edit_id, user_id)
		DO UPDATE SET (vote, created_at) = (:vote, NOW())
	`
	return qb.dbi.InsertJoin(editVoteTable, newJoin, &conflictHandling)
}

func (qb *editQueryBuilder) GetVotes(id uuid.UUID) (models.EditVotes, error) {
	joins := models.EditVotes{}
	err := qb.dbi.FindJoins(editVoteTable, id, &joins)

	return joins, err
}

func (qb *editQueryBuilder) findByJoin(id uuid.UUID, table tableJoin, idColumn string) ([]*models.Edit, error) {
	query := fmt.Sprintf(`
SELECT edits.* FROM edits
JOIN %s as edit_join
ON edit_join.edit_id = edits.id
WHERE edit_join.%s = ?`, table.name, idColumn)

	args := []interface{}{id}
	return qb.queryEdits(query, args)
}

func (qb *editQueryBuilder) FindByTagID(id uuid.UUID) ([]*models.Edit, error) {
	return qb.findByJoin(id, editTagTable, "tag_id")
}

func (qb *editQueryBuilder) FindByPerformerID(id uuid.UUID) ([]*models.Edit, error) {
	return qb.findByJoin(id, editPerformerTable, "performer_id")
}

func (qb *editQueryBuilder) FindByStudioID(id uuid.UUID) ([]*models.Edit, error) {
	return qb.findByJoin(id, editStudioTable, "studio_id")
}

func (qb *editQueryBuilder) FindBySceneID(id uuid.UUID) ([]*models.Edit, error) {
	return qb.findByJoin(id, editSceneTable, "scene_id")
}

// Returns pending edits that fulfill one of the criteria for being closed:
// * The full voting period has passed
// * The minimum voting period has passed, and the number of votes has crossed the voting threshold.
// The latter only applies for destructive edits. Non-destructive edits get auto-applied when sufficient votes are cast.
func (qb *editQueryBuilder) FindCompletedEdits(votingPeriod int, minimumVotingPeriod int, minimumVotes int) ([]*models.Edit, error) {
	query := `
		SELECT edits.* FROM edits
		WHERE status = 'PENDING'
		AND (
			(created_at <= (now()::timestamp - (INTERVAL '1 second' * $1)) AND updated_at IS NULL)
			OR
			(updated_at <= (now()::timestamp - (INTERVAL '1 second' * $1)) AND updated_at IS NOT NULL)
			OR (
				VOTES >= $2
				AND (
					(created_at <= (now()::timestamp - (INTERVAL '1 second' * $3)) AND updated_at IS NULL)
					OR
					(updated_at <= (now()::timestamp - (INTERVAL '1 second' * $3)) AND updated_at IS NOT NULL)
				)
			)
		)
	`

	args := []interface{}{votingPeriod, minimumVotes, minimumVotingPeriod}
	return qb.queryEdits(query, args)
}
