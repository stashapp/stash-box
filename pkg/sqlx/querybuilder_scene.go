package sqlx

import (
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
	"github.com/stashapp/stash-box/pkg/edit"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	sceneTable   = "scenes"
	sceneJoinKey = "scene_id"
)

var (
	sceneDBTable = newTable(sceneTable, func() interface{} {
		return &models.Scene{}
	})

	sceneFingerprintTable = newTableJoin(sceneTable, "scene_fingerprints", sceneJoinKey, func() interface{} {
		return &dbSceneFingerprint{}
	})

	sceneURLTable = newTableJoin(sceneTable, "scene_urls", sceneJoinKey, func() interface{} {
		return &models.SceneURL{}
	})

	sceneRedirectTable = newTableJoin(sceneTable, "scene_redirects", "source_id", func() interface{} {
		return &models.Redirect{}
	})
)

type sceneQueryBuilder struct {
	dbi *dbi
}

func newSceneQueryBuilder(txn *txnState) models.SceneRepo {
	return &sceneQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *sceneQueryBuilder) toModel(ro interface{}) *models.Scene {
	if ro != nil {
		return ro.(*models.Scene)
	}

	return nil
}

func (qb *sceneQueryBuilder) Create(newScene models.Scene) (*models.Scene, error) {
	ret, err := qb.dbi.Insert(sceneDBTable, newScene)
	return qb.toModel(ret), err
}

func (qb *sceneQueryBuilder) Update(updatedScene models.Scene) (*models.Scene, error) {
	ret, err := qb.dbi.Update(sceneDBTable, updatedScene, true)
	return qb.toModel(ret), err
}

func (qb *sceneQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, sceneDBTable)
}

func (qb *sceneQueryBuilder) CreateURLs(newJoins models.SceneURLs) error {
	return qb.dbi.InsertJoins(sceneURLTable, &newJoins)
}

func (qb *sceneQueryBuilder) UpdateURLs(scene uuid.UUID, updatedJoins models.SceneURLs) error {
	return qb.dbi.ReplaceJoins(sceneURLTable, scene, &updatedJoins)
}

func (qb *sceneQueryBuilder) CreateOrReplaceFingerprints(sceneFingerprints models.SceneFingerprints) error {
	conflictHandling := `
		ON CONFLICT ON CONSTRAINT scene_fingerprints_scene_id_fingerprint_id_user_id_key
		DO UPDATE SET 
		duration = EXCLUDED.duration,
		vote = EXCLUDED.vote
	`

	var fingerprints dbSceneFingerprints
	for _, fp := range sceneFingerprints {
		id, err := qb.getOrCreateFingerprintID(fp.Hash, fp.Algorithm)
		if err != nil {
			return err
		}

		fingerprints = append(fingerprints, &dbSceneFingerprint{
			FingerprintID: id,
			SceneID:       fp.SceneID,
			UserID:        fp.UserID,
			Duration:      fp.Duration,
			Vote:          fp.Vote,
		})
	}

	return qb.dbi.InsertJoinsWithConflictHandling(sceneFingerprintTable, &fingerprints, conflictHandling)
}

func (qb *sceneQueryBuilder) UpdateFingerprints(sceneID uuid.UUID, updatedJoins models.SceneFingerprints) error {
	if err := qb.dbi.DeleteJoins(sceneFingerprintTable, sceneID); err != nil {
		return err
	}

	return qb.CreateOrReplaceFingerprints(updatedJoins)
}

func (qb *sceneQueryBuilder) DestroyFingerprints(sceneID uuid.UUID, toDestroy models.SceneFingerprints) error {
	for _, fp := range toDestroy {
		res, err := qb.dbi.db().ExecContext(qb.dbi.txn.ctx, `
		DELETE FROM scene_fingerprints SFP
		USING fingerprints FP
		WHERE SFP.fingerprint_id = FP.id
		AND FP.hash = $1
		AND FP.algorithm = $2
		AND user_id = $3
		AND scene_id = $4
		`, fp.Hash, fp.Algorithm, fp.UserID, fp.SceneID)
		if err != nil {
			return err
		}
		if affectedRows, _ := res.RowsAffected(); affectedRows == 0 {
			return fmt.Errorf("%s fingerprint %s was not found", fp.Algorithm, fp.Hash)
		}
	}

	return nil
}

func (qb *sceneQueryBuilder) Find(id uuid.UUID) (*models.Scene, error) {
	ret, err := qb.dbi.Find(id, sceneDBTable)
	return qb.toModel(ret), err
}

func (qb *sceneQueryBuilder) FindByFingerprint(algorithm models.FingerprintAlgorithm, hash string) ([]*models.Scene, error) {
	query := `
		SELECT scenes.* FROM scenes
		JOIN scene_fingerprints as SFP on SFP.scene_id = scenes.id
		JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
		WHERE FP.algorithm = ? AND FP.hash = ?`
	var args []interface{}
	args = append(args, algorithm.String())
	args = append(args, hash)
	return qb.queryScenes(query, args)
}

func (qb *sceneQueryBuilder) FindByFingerprints(fingerprints []string) ([]*models.Scene, error) {
	query := `
		SELECT scenes.* FROM scenes
		WHERE id IN (
			SELECT scene_id AS id
			FROM scene_fingerprints SFP
			JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
			WHERE FP.hash IN (?)
			GROUP BY scene_id
		)`
	query, args, err := sqlx.In(query, fingerprints)
	if err != nil {
		return nil, err
	}
	return qb.queryScenes(query, args)
}

func (qb *sceneQueryBuilder) FindByFullFingerprints(fingerprints []*models.FingerprintQueryInput) ([]*models.Scene, error) {
	hashClause := `
		SELECT SFP.scene_id AS id
		FROM scene_fingerprints SFP
		JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
		WHERE FP.hash IN (:hashes)
		GROUP BY SFP.scene_id
	`
	phashClause := `
		SELECT SFP.scene_id AS id
		FROM UNNEST(ARRAY[:phashes]) phash
		JOIN fingerprints FP ON ('x' || hash)::::bit(64)::::bigint <@ (phash::::BIGINT, :distance)
		AND algorithm = 'PHASH'
		JOIN scene_fingerprints SFP ON SFP.fingerprint_id = FP.id
	`

	var phashes []int64
	var hashes []string
	for _, fp := range fingerprints {
		if fp.Algorithm == models.FingerprintAlgorithmPhash {
			// Postgres only supports signed integers, so we parse
			// as uint64 and cast to int64 to ensure values are the same.
			value, err := strconv.ParseUint(fp.Hash, 16, 64)
			if err == nil {
				phashes = append(phashes, int64(value))
			}
		} else {
			hashes = append(hashes, fp.Hash)
		}
	}

	var clauses []string
	if len(phashes) > 0 {
		clauses = append(clauses, phashClause)
	}
	if len(hashes) > 0 {
		clauses = append(clauses, hashClause)
	}
	if len(clauses) == 0 {
		return nil, nil
	}

	arg := map[string]interface{}{
		"phashes":  phashes,
		"hashes":   hashes,
		"distance": config.GetPHashDistance(),
	}

	query := `
		SELECT scenes.* FROM scenes
		WHERE id IN (` + strings.Join(clauses, " UNION ") + ")"
	query, args, err := sqlx.Named(query, arg)
	if err != nil {
		return nil, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return nil, err
	}
	return qb.queryScenes(query, args)
}

func (qb *sceneQueryBuilder) FindByIds(ids []uuid.UUID) ([]*models.Scene, []error) {
	query := `
		SELECT scenes.* FROM scenes
		WHERE id IN (?)
	`
	query, args, _ := sqlx.In(query, ids)
	scenes, err := qb.queryScenes(query, args)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*models.Scene)
	for _, scene := range scenes {
		m[scene.ID] = scene
	}

	result := make([]*models.Scene, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, utils.DuplicateError(nil, len(ids))
}

func (qb *sceneQueryBuilder) FindIdsBySceneFingerprints(fingerprints []*models.FingerprintQueryInput) (map[string][]uuid.UUID, error) {
	hashClause := `
		SELECT scene_id, hash
		FROM fingerprints FP
		JOIN scene_fingerprints SFP ON FP.id = SFP.fingerprint_id
		JOIN scenes ON scene_id = scenes.id
		WHERE hash IN (:hashes) AND deleted = FALSE
		GROUP BY scene_id, hash
	`
	phashClause := `
		SELECT scene_id, to_hex(phash::::bigint) as hash
		FROM UNNEST(ARRAY[:phashes]) phash
		JOIN fingerprints FP ON ('x' || hash)::::bit(64)::::bigint <@ (phash::::BIGINT, :distance)
		AND algorithm = 'PHASH'
		JOIN scene_fingerprints SFP ON FP.id = SFP.fingerprint_id
		JOIN scenes ON scene_id = scenes.id
		WHERE deleted = FALSE
		GROUP BY scene_id, phash
	`

	var phashes []int64
	var hashes []string
	for _, fp := range fingerprints {
		if fp.Algorithm == models.FingerprintAlgorithmPhash {
			// Postgres only supports signed integers, so we parse
			// as uint64 and cast to int64 to ensure values are the same.
			value, err := strconv.ParseUint(fp.Hash, 16, 64)
			if err == nil {
				phashes = append(phashes, int64(value))
			}
		} else {
			hashes = append(hashes, fp.Hash)
		}
	}

	var clauses []string
	if len(phashes) > 0 {
		clauses = append(clauses, phashClause)
	}
	if len(hashes) > 0 {
		clauses = append(clauses, hashClause)
	}
	if len(clauses) == 0 {
		return nil, nil
	}

	arg := map[string]interface{}{
		"phashes":  phashes,
		"hashes":   hashes,
		"distance": config.GetPHashDistance(),
	}

	query := strings.Join(clauses, " UNION ")
	query, args, err := sqlx.Named(query, arg)
	if err != nil {
		return nil, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return nil, err
	}

	query = qb.dbi.db().Rebind(query)

	output := models.SceneFingerprints{}
	if err := qb.dbi.db().SelectContext(qb.dbi.txn.ctx, &output, query, args...); err != nil {
		return nil, err
	}

	res := make(map[string][]uuid.UUID)
	output.Each(func(row interface{}) {
		fp := row.(models.SceneFingerprint)
		res[fp.Hash] = append(res[fp.Hash], fp.SceneID)
	})

	return res, nil
}

func (qb *sceneQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi, buildCountQuery("SELECT scenes.id FROM scenes"), nil)
}

func (qb *sceneQueryBuilder) buildQuery(filter models.SceneQueryInput, userID uuid.UUID, isCount bool) (*queryBuilder, error) {
	query := newQueryBuilder(sceneDBTable)

	if q := filter.URL; q != nil && *q != "" {
		where := fmt.Sprintf("%s.url = ?", sceneURLTable.Name())
		query.AddJoinTableFilter(sceneURLTable, where, false, nil, false, *q)
	}

	if filter.ParentStudio != nil {
		query.Body += "JOIN studios ON scenes.studio_id = studios.id AND (studios.parent_studio_id = ? OR studios.id = ?)"
		query.AddArg(*filter.ParentStudio, *filter.ParentStudio)
	}

	if q := filter.Performers; q != nil && len(q.Value) > 0 {
		if err := setMultiCriterionClause(query, scenePerformerTable, performerJoinKey, q, false); err != nil {
			return nil, err
		}
	}

	if q := filter.Tags; q != nil && len(q.Value) > 0 {
		if err := setMultiCriterionClause(query, sceneTagTable, tagJoinKey, q, false); err != nil {
			return nil, err
		}
	}

	if q := filter.Fingerprints; q != nil && len(q.Value) > 0 {
		inClause := getInBinding(len(q.Value))
		query.Body += `
			JOIN (
				SELECT scene_id
				FROM scene_fingerprints SFP
				JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
				WHERE FP.hash IN ` + inClause + `
				GROUP BY scene_id
			) T ON scenes.id = T.scene_id
		`

		for _, hash := range q.Value {
			query.AddArg(hash)
		}
	}

	if filter.HasFingerprintSubmissions != nil && *filter.HasFingerprintSubmissions {
		query.Body += `
			JOIN (
				SELECT scene_id
				FROM scene_fingerprints
				WHERE user_id = ?
				GROUP BY scene_id
			) SFP ON scenes.id = SFP.scene_id
		`
		query.AddArg(userID)
	}

	if q := filter.Text; q != nil && *q != "" {
		searchColumns := []string{"scenes.title", "scenes.details"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, false)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if q := filter.Title; q != nil && *q != "" {
		searchColumns := []string{"scenes.title"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, false)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if q := filter.Studios; q != nil && len(q.Value) > 0 {
		column := "scenes.studio_id"

		switch q.Modifier {
		case models.CriterionModifierEquals:
			query.Eq(column, q.Value[0])
		case models.CriterionModifierNotEquals:
			query.NotEq(column, q.Value[0])
		case models.CriterionModifierIsNull:
			query.IsNull(column)
		case models.CriterionModifierNotNull:
			query.IsNotNull(column)
		case models.CriterionModifierIncludes:
			query.AddWhere(column + " IN " + getInBinding(len(q.Value)))
			for _, studioID := range q.Value {
				query.AddArg(studioID)
			}
		case models.CriterionModifierExcludes:
			query.AddWhere(column + " NOT IN " + getInBinding(len(q.Value)))
			for _, studioID := range q.Value {
				query.AddArg(studioID)
			}
		case models.CriterionModifierGreaterThan:
			fallthrough
		case models.CriterionModifierIncludesAll:
			fallthrough
		case models.CriterionModifierLessThan:
			return nil, fmt.Errorf("unsupported modifier %s for scenes.studio_id", q.Modifier)
		}
	}

	if q := filter.Date; q != nil {
		column := "scenes.date"
		switch q.Modifier {
		case models.CriterionModifierEquals:
			query.AddWhere(fmt.Sprintf("%s = ?", column))
			query.AddArg(q.Value)
		case models.CriterionModifierNotEquals:
			query.AddWhere(fmt.Sprintf("%s != ?", column))
			query.AddArg(q.Value)
		case models.CriterionModifierGreaterThan:
			query.AddWhere(fmt.Sprintf("%s > ?", column))
			query.AddArg(q.Value)
		case models.CriterionModifierLessThan:
			query.AddWhere(fmt.Sprintf("%s < ?", column))
			query.AddArg(q.Value)
		case models.CriterionModifierIsNull:
			query.AddWhere(fmt.Sprintf("%s IS NULL", column))
		case models.CriterionModifierNotNull:
			query.AddWhere(fmt.Sprintf("%s IS NOT NULL", column))
		case models.CriterionModifierIncludesAll, models.CriterionModifierIncludes, models.CriterionModifierExcludes:
			return nil, fmt.Errorf("unsupported modifier %s for scenes.date", q.Modifier)
		default:
			return nil, fmt.Errorf("unsupported modifier %s for scenes.date", q.Modifier)
		}
	}

	if q := filter.Favorites; q != nil {
		var clauses []string
		if *q == models.FavoriteFilterPerformer || *q == models.FavoriteFilterAll {
			clauses = append(clauses, `(
					SELECT scene_id FROM performer_favorites PF
					JOIN scene_performers SP ON PF.performer_id = SP.performer_id
					WHERE PF.user_id = ?
			)`)
			query.AddArg(userID)
		}
		if *q == models.FavoriteFilterStudio || *q == models.FavoriteFilterAll {
			clauses = append(clauses, `(
					SELECT S.id FROM studio_favorites SF
					JOIN scenes S ON SF.studio_id = S.studio_id
					WHERE SF.user_id = ?
			)`)
			query.AddArg(userID)
		}

		clause := "(scenes.id IN (" + strings.Join(clauses, " UNION ") + "))"
		query.AddWhere(clause)
	}

	if filter.Sort == models.SceneSortEnumTrending {
		limit := ""
		if len(query.whereClauses) == 0 && !isCount {
			// If no other filters are applied we can optimize query
			// by sorting and limiting fingerprint count directly
			limit = "ORDER BY count DESC " + getPagination(filter.Page, filter.PerPage)
		} else {
			query.Pagination = getPagination(filter.Page, filter.PerPage)
		}

		query.Body += `
			JOIN (
				SELECT scene_id, COUNT(*) AS count
				FROM scene_fingerprints
				WHERE created_at >= (now()::DATE - 7)
				GROUP BY scene_id
				` + limit + `
			) T ON scenes.id = T.scene_id
		`
		query.Sort = " ORDER BY T.count DESC, T.scene_id DESC "
	} else {
		query.Sort = qb.getSceneSort(filter)
		query.Pagination = getPagination(filter.Page, filter.PerPage)
	}

	query.Eq("scenes.deleted", false)

	return query, nil
}

func (qb *sceneQueryBuilder) QueryScenes(filter models.SceneQueryInput, userID uuid.UUID) ([]*models.Scene, error) {
	query, err := qb.buildQuery(filter, userID, false)
	if err != nil {
		return nil, err
	}

	var scenes models.Scenes
	err = qb.dbi.QueryOnly(*query, &scenes)

	return scenes, err
}

func (qb *sceneQueryBuilder) QueryCount(filter models.SceneQueryInput, userID uuid.UUID) (int, error) {
	query, err := qb.buildQuery(filter, userID, true)
	if err != nil {
		return 0, err
	}
	return qb.dbi.CountOnly(*query)
}

func setMultiCriterionClause(query *queryBuilder, joinTable tableJoin, joinTableField string, criterion models.MultiCriterionInput, group bool) error {
	args := criterion.GetValues()
	inClause := fmt.Sprintf("%s.%s IN %s", joinTable.Name(), joinTableField, getInBinding(criterion.Count()))

	groupBy := group || len(args) > 1

	switch criterion.GetModifier() {
	case models.CriterionModifierIncludes:
		// includes any of the provided ids
		query.AddJoinTableFilter(joinTable, inClause, groupBy, nil, false, args...)

	case models.CriterionModifierIncludesAll:
		// includes all of the provided ids
		having := fmt.Sprintf("COUNT(*) = %d", criterion.Count())
		query.AddJoinTableFilter(joinTable, inClause, true, &having, false, args...)

	case models.CriterionModifierExcludes:
		// excludes all of the provided ids
		query.AddJoinTableFilter(joinTable, inClause, groupBy, nil, true, args...)

	default:
		return fmt.Errorf("unsupported modifier %s for %s.%s", criterion.GetModifier(), joinTable.Name(), joinTableField)
	}

	return nil
}

func (qb *sceneQueryBuilder) getSceneSort(filter models.SceneQueryInput) string {
	secondary := "title"
	if filter.Sort != models.SceneSortEnumTitle {
		secondary = "id"
	}
	return getSort(filter.Sort.String(), filter.Direction.String(), "scenes", &secondary)
}

func (qb *sceneQueryBuilder) queryScenes(query string, args []interface{}) (models.Scenes, error) {
	output := models.Scenes{}
	err := qb.dbi.RawQuery(sceneDBTable, query, args, &output)
	return output, err
}

type sceneFingerprintGroup struct {
	SceneID        uuid.UUID                   `db:"scene_id"`
	Hash           string                      `db:"hash"`
	Algorithm      models.FingerprintAlgorithm `db:"algorithm"`
	Duration       float64                     `db:"duration"`
	Submissions    int                         `db:"submissions"`
	Reports        int                         `db:"reports"`
	NetSubmissions int                         `db:"net_submissions"`
	UserSubmitted  bool                        `db:"user_submitted"`
	UserReported   bool                        `db:"user_reported"`
	CreatedAt      time.Time                   `db:"created_at"`
	UpdatedAt      time.Time                   `db:"updated_at"`
}

func fingerprintGroupToFingerprint(fpg sceneFingerprintGroup) *models.Fingerprint {
	return &models.Fingerprint{
		Hash:          fpg.Hash,
		Algorithm:     fpg.Algorithm,
		Duration:      int(fpg.Duration),
		Submissions:   fpg.Submissions,
		Reports:       fpg.Reports,
		UserSubmitted: fpg.UserSubmitted,
		UserReported:  fpg.UserReported,
		Created:       fpg.CreatedAt,
		Updated:       fpg.UpdatedAt,
	}
}

func (qb *sceneQueryBuilder) GetFingerprints(id uuid.UUID) (models.SceneFingerprints, error) {
	fingerprints := models.SceneFingerprints{}
	err := qb.dbi.db().SelectContext(qb.dbi.txn.ctx, &fingerprints, `
    SELECT SFP.scene_id, SFP.user_id, SFP.duration, SFP.created_at, FP.hash, FP.algorithm
		FROM scene_fingerprints SFP
		JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
		WHERE SFP.scene_id = $1
	`, id)
	return fingerprints, err
}

func (qb *sceneQueryBuilder) GetAllFingerprints(currentUserID uuid.UUID, ids []uuid.UUID, onlySubmitted bool) ([][]*models.Fingerprint, []error) {
	query := `
		SELECT
			SFP.scene_id,
			FP.hash,
			FP.algorithm,
			mode() WITHIN GROUP (ORDER BY SFP.duration) as duration,
			COUNT(CASE WHEN SFP.vote = 1 THEN 1 END) as submissions,
			COUNT(CASE WHEN SFP.vote = -1 THEN 1 END) as reports,
			SUM(SFP.vote) as net_submissions,
			MIN(created_at) as created_at,
			MAX(created_at) as updated_at,
			bool_or(SFP.user_id = :userid AND SFP.vote = 1) as user_submitted,
			bool_or(SFP.user_id = :userid AND SFP.vote = -1) as user_reported
		FROM scene_fingerprints SFP
		JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
		WHERE SFP.scene_id IN (:sceneids)
	`

	if onlySubmitted {
		query += "AND SFP.user_id = :userid"
	}

	query += `
		GROUP BY SFP.scene_id, FP.algorithm, FP.hash
		ORDER BY net_submissions DESC`

	arg := map[string]interface{}{
		"userid":   currentUserID,
		"sceneids": ids,
	}
	m := make(map[uuid.UUID][]*models.Fingerprint)

	query, args, err := sqlx.Named(query, arg)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	if err := qb.dbi.queryFunc(query, args, func(rows *sqlx.Rows) error {
		var fg sceneFingerprintGroup

		if err := rows.StructScan(&fg); err != nil {
			return err
		}

		fp := fingerprintGroupToFingerprint(fg)

		m[fg.SceneID] = append(m[fg.SceneID], fp)
		return nil
	}); err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	result := make([][]*models.Fingerprint, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

// SubmittedHashExists returns true if the given hash exists for the given scene
func (qb *sceneQueryBuilder) SubmittedHashExists(sceneID uuid.UUID, hash string, algorithm models.FingerprintAlgorithm) (bool, error) {
	query := `
		SELECT
			1
		FROM scene_fingerprints f
		JOIN fingerprints fp ON f.fingerprint_id = fp.id
		WHERE f.scene_id = :sceneid AND fp.hash = :hash AND fp.algorithm = :algorithm AND f.vote = 1
	`

	arg := map[string]interface{}{
		"sceneid":   sceneID,
		"hash":      hash,
		"algorithm": algorithm,
	}

	query, args, err := sqlx.Named(query, arg)
	if err != nil {
		return false, err
	}

	result := false
	if err := qb.dbi.queryFunc(query, args, func(rows *sqlx.Rows) error {
		result = true
		return nil
	}); err != nil {
		return false, err
	}

	return result, nil
}

func (qb *sceneQueryBuilder) GetPerformers(id uuid.UUID) (models.PerformersScenes, error) {
	joins := models.PerformersScenes{}
	err := qb.dbi.FindJoins(scenePerformerTable, id, &joins)

	return joins, err
}

func (qb *sceneQueryBuilder) GetAllAppearances(ids []uuid.UUID) ([]models.PerformersScenes, []error) {
	joins := models.PerformersScenes{}
	err := qb.dbi.FindAllJoins(scenePerformerTable, ids, &joins)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]models.PerformersScenes)
	for _, join := range joins {
		m[join.SceneID] = append(m[join.SceneID], join)
	}

	result := make([]models.PerformersScenes, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *sceneQueryBuilder) GetImages(id uuid.UUID) (models.ScenesImages, error) {
	joins := models.ScenesImages{}
	err := qb.dbi.FindJoins(sceneImageTable, id, &joins)

	return joins, err
}

func (qb *sceneQueryBuilder) GetTags(id uuid.UUID) (models.ScenesTags, error) {
	joins := models.ScenesTags{}
	err := qb.dbi.FindJoins(sceneTagTable, id, &joins)

	return joins, err
}

func (qb *sceneQueryBuilder) getSceneURLs(id uuid.UUID) (models.SceneURLs, error) {
	joins := models.SceneURLs{}
	err := qb.dbi.FindJoins(sceneURLTable, id, &joins)
	return joins, err
}

func (qb *sceneQueryBuilder) GetURLs(id uuid.UUID) ([]*models.URL, error) {
	joins, err := qb.getSceneURLs(id)
	if err != nil {
		return nil, err
	}

	urls := make([]*models.URL, len(joins))
	for i, u := range joins {
		url := models.URL{
			URL:    u.URL,
			SiteID: u.SiteID,
		}
		urls[i] = &url
	}

	return urls, nil
}

func (qb *sceneQueryBuilder) GetAllURLs(ids []uuid.UUID) ([][]*models.URL, []error) {
	joins := models.SceneURLs{}
	err := qb.dbi.FindAllJoins(sceneURLTable, ids, &joins)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]*models.URL)
	for _, join := range joins {
		url := models.URL{
			URL:    join.URL,
			SiteID: join.SiteID,
		}
		m[join.SceneID] = append(m[join.SceneID], &url)
	}

	result := make([][]*models.URL, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *sceneQueryBuilder) SearchScenes(term string, limit int) ([]*models.Scene, error) {
	query := `
        SELECT S.* FROM scenes S
        LEFT JOIN scene_search SS ON SS.scene_id = S.id
        WHERE (
			to_tsvector('english', COALESCE(scene_date, '')) ||
			to_tsvector('english', studio_name) ||
			to_tsvector('english', COALESCE(performer_names, '')) ||
			to_tsvector('english', scene_title) ||
			to_tsvector('english', COALESCE(scene_code, ''))
        ) @@ websearch_to_tsquery('english', ?)
        AND S.deleted = FALSE
        LIMIT ?`
	var args []interface{}
	args = append(args, term, limit)
	return qb.queryScenes(query, args)
}

func (qb *sceneQueryBuilder) CountByPerformer(id uuid.UUID) (int, error) {
	var args []interface{}
	args = append(args, id)
	return runCountQuery(qb.dbi, buildCountQuery("SELECT scene_id FROM scene_performers WHERE performer_id = ?"), args)
}

func (qb *sceneQueryBuilder) SoftDelete(scene models.Scene) (*models.Scene, error) {
	// Delete joins
	if err := qb.dbi.DeleteJoins(sceneFingerprintTable, scene.ID); err != nil {
		return nil, err
	}
	if err := qb.dbi.DeleteJoins(sceneImageTable, scene.ID); err != nil {
		return nil, err
	}
	if err := qb.dbi.DeleteJoins(sceneURLTable, scene.ID); err != nil {
		return nil, err
	}
	if err := qb.dbi.DeleteJoins(scenePerformerTable, scene.ID); err != nil {
		return nil, err
	}
	if err := qb.dbi.DeleteJoins(sceneTagTable, scene.ID); err != nil {
		return nil, err
	}

	ret, err := qb.dbi.SoftDelete(sceneDBTable, scene)
	return qb.toModel(ret), err
}

func (qb *sceneQueryBuilder) CreateRedirect(newJoin models.Redirect) error {
	return qb.dbi.InsertJoin(sceneRedirectTable, newJoin, nil)
}

func (qb *sceneQueryBuilder) UpdateRedirects(oldTargetID uuid.UUID, newTargetID uuid.UUID) error {
	query := "UPDATE " + sceneRedirectTable.table.Name() + " SET target_id = ? WHERE target_id = ?"
	args := []interface{}{newTargetID, oldTargetID}
	return qb.dbi.RawQuery(sceneRedirectTable.table, query, args, nil)
}

func (qb *sceneQueryBuilder) UpdateImages(sceneID uuid.UUID, updatedJoins models.ScenesImages) error {
	return qb.dbi.ReplaceJoins(sceneImageTable, sceneID, &updatedJoins)
}

func (qb *sceneQueryBuilder) UpdateTags(sceneID uuid.UUID, updatedJoins models.ScenesTags) error {
	return qb.dbi.ReplaceJoins(sceneTagTable, sceneID, &updatedJoins)
}

func (qb *sceneQueryBuilder) UpdatePerformers(sceneID uuid.UUID, updatedJoins models.PerformersScenes) error {
	return qb.dbi.ReplaceJoins(scenePerformerTable, sceneID, &updatedJoins)
}

func (qb *sceneQueryBuilder) ApplyEdit(scene *models.Scene, create bool, data *models.SceneEditData, userID *uuid.UUID) (*models.Scene, error) {
	old := data.Old
	if old == nil {
		old = &models.SceneEdit{}
	}
	scene.CopyFromSceneEdit(*data.New, old)

	var updatedScene *models.Scene
	var err error
	if create {
		updatedScene, err = qb.Create(*scene)
	} else {
		updatedScene, err = qb.Update(*scene)
	}
	if err != nil {
		return nil, err
	}

	if err := qb.updateURLsFromEdit(scene, data); err != nil {
		return nil, err
	}

	if err := qb.updateImagesFromEdit(scene, data); err != nil {
		return nil, err
	}

	if err := qb.updateTagsFromEdit(scene, data); err != nil {
		return nil, err
	}

	if err := qb.updatePerformersFromEdit(scene, data); err != nil {
		return nil, err
	}

	if create && len(data.New.AddedFingerprints) > 0 && userID != nil {
		if err := qb.addFingerprintsFromEdit(scene, data, *userID); err != nil {
			return nil, err
		}
	}

	return updatedScene, err
}

func (qb *sceneQueryBuilder) GetEditURLs(id *uuid.UUID, data *models.SceneEdit) ([]*models.URL, error) {
	var urls []*models.URL
	if id != nil {
		currentURLs, err := qb.GetURLs(*id)
		if err != nil {
			return nil, err
		}
		urls = currentURLs
	}
	return edit.MergeURLs(urls, data.AddedUrls, data.RemovedUrls), nil
}

func (qb *sceneQueryBuilder) updateURLsFromEdit(scene *models.Scene, data *models.SceneEditData) error {
	urls, err := qb.GetEditURLs(&scene.ID, data.New)
	if err != nil {
		return err
	}

	newURLs := models.CreateSceneURLs(scene.ID, urls)
	return qb.UpdateURLs(scene.ID, newURLs)
}

func (qb *sceneQueryBuilder) GetEditImages(id *uuid.UUID, data *models.SceneEdit) ([]uuid.UUID, error) {
	var imageIds []uuid.UUID
	if id != nil {
		currentImages, err := qb.GetImages(*id)
		if err != nil {
			return nil, err
		}
		for _, v := range currentImages {
			imageIds = append(imageIds, v.ImageID)
		}
	}
	return utils.ProcessSlice(imageIds, data.AddedImages, data.RemovedImages), nil
}

func (qb *sceneQueryBuilder) updateImagesFromEdit(scene *models.Scene, data *models.SceneEditData) error {
	ids, err := qb.GetEditImages(&scene.ID, data.New)
	if err != nil {
		return err
	}

	images := models.CreateSceneImages(scene.ID, ids)
	return qb.UpdateImages(scene.ID, images)
}

func (qb *sceneQueryBuilder) GetEditTags(id *uuid.UUID, data *models.SceneEdit) ([]uuid.UUID, error) {
	var tagIds []uuid.UUID
	if id != nil {
		currentTags, err := qb.GetTags(*id)
		if err != nil {
			return nil, err
		}
		for _, tag := range currentTags {
			tagIds = append(tagIds, tag.TagID)
		}
	}

	return utils.ProcessSlice(tagIds, data.AddedTags, data.RemovedTags), nil
}

func (qb *sceneQueryBuilder) updateTagsFromEdit(scene *models.Scene, data *models.SceneEditData) error {
	tags, err := qb.GetEditTags(&scene.ID, data.New)
	if err != nil {
		return err
	}
	newTags := models.CreateSceneTags(scene.ID, tags)

	return qb.UpdateTags(scene.ID, newTags)
}

func (qb *sceneQueryBuilder) GetEditPerformers(id *uuid.UUID, obj *models.SceneEdit) ([]*models.PerformerAppearanceInput, error) {
	// Pointers aren't compared by value, so we have to use a temporary struct
	type appearance struct {
		ID uuid.UUID
		As string
	}

	var appearances []appearance
	if id != nil {
		currentPerformers, err := qb.GetPerformers(*id)
		if err != nil {
			return nil, err
		}
		for _, a := range currentPerformers {
			appearances = append(appearances, appearance{
				As: a.As.String,
				ID: a.PerformerID,
			})
		}
	}

	var added []appearance
	for _, a := range obj.AddedPerformers {
		added = append(added, appearance{
			As: utils.StrPtrToString(a.As),
			ID: a.PerformerID,
		})
	}

	var removed []appearance
	for _, a := range obj.RemovedPerformers {
		removed = append(removed, appearance{
			As: utils.StrPtrToString(a.As),
			ID: a.PerformerID,
		})
	}

	appearances = utils.ProcessSlice(appearances, added, removed)

	var ret []*models.PerformerAppearanceInput
	for i := range appearances {
		ret = append(ret, &models.PerformerAppearanceInput{
			As:          utils.StringToStrPtr(appearances[i].As),
			PerformerID: appearances[i].ID,
		})
	}

	return ret, nil
}

func (qb *sceneQueryBuilder) updatePerformersFromEdit(scene *models.Scene, data *models.SceneEditData) error {
	appearances, err := qb.GetEditPerformers(&scene.ID, data.New)
	if err != nil {
		return err
	}

	newPerformers := models.CreateScenePerformers(scene.ID, appearances)
	return qb.UpdatePerformers(scene.ID, newPerformers)
}

func (qb *sceneQueryBuilder) addFingerprintsFromEdit(scene *models.Scene, data *models.SceneEditData, userID uuid.UUID) error {
	var newFingerprints models.SceneFingerprints
	for _, fingerprint := range data.New.AddedFingerprints {
		if fingerprint.Duration > 0 {
			newFingerprints = append(newFingerprints, &models.SceneFingerprint{
				Hash:      fingerprint.Hash,
				Algorithm: fingerprint.Algorithm.String(),
				SceneID:   scene.ID,
				UserID:    userID,
				Vote:      1,
				Duration:  fingerprint.Duration,
				CreatedAt: time.Now(),
			})
		}
	}

	return qb.CreateOrReplaceFingerprints(newFingerprints)
}

func (qb *sceneQueryBuilder) getOrCreateFingerprintID(hash string, algorithm string) (int, error) {
	id, err := qb.getFingerprintID(hash, algorithm)
	if errors.Is(err, sql.ErrNoRows) {
		id, err = qb.createFingerprint(hash, algorithm)
	}

	return id, err
}

func (qb *sceneQueryBuilder) getFingerprintID(hash string, algorithm string) (int, error) {
	var id int
	err := qb.dbi.db().GetContext(qb.dbi.txn.ctx, &id, "SELECT id FROM fingerprints WHERE hash = $1 AND algorithm = $2", hash, algorithm)

	return id, err
}

func (qb *sceneQueryBuilder) createFingerprint(hash string, algorithm string) (int, error) {
	var id int
	err := qb.dbi.db().GetContext(qb.dbi.txn.ctx, &id, "INSERT INTO fingerprints (hash, algorithm) VALUES ($1, $2) RETURNING id", hash, algorithm)

	return id, err
}

func (qb *sceneQueryBuilder) MergeInto(source *models.Scene, target *models.Scene) error {
	if source.Deleted {
		return fmt.Errorf("merge source scene is deleted: %s", source.ID.String())
	}
	if target.Deleted {
		return fmt.Errorf("merge target scene is deleted: %s", target.ID.String())
	}

	if _, err := qb.SoftDelete(*source); err != nil {
		return err
	}

	if err := qb.UpdateRedirects(source.ID, target.ID); err != nil {
		return err
	}

	redirect := models.Redirect{SourceID: source.ID, TargetID: target.ID}
	return qb.CreateRedirect(redirect)
}

func (qb *sceneQueryBuilder) FindExistingScenes(input models.QueryExistingSceneInput) ([]*models.Scene, error) {
	if (input.StudioID == nil || input.Title == nil) && len(input.Fingerprints) == 0 {
		return nil, nil
	}

	var clauses []string
	arg := make(map[string]interface{})

	if input.Title != nil && input.StudioID != nil {
		arg["title"] = *input.Title
		arg["studio"] = *input.StudioID
		clauses = append(clauses, `
			(TRIM(LOWER(title)) = TRIM(LOWER(:title)) AND studio_id = :studio)
		`)
	}
	if len(input.Fingerprints) > 0 {
		var hashes []string
		for _, fp := range input.Fingerprints {
			hashes = append(hashes, fp.Hash)
		}
		arg["hashes"] = hashes
		clauses = append(clauses, `
			id IN (
				SELECT scene_id
				FROM scene_fingerprints SFP
				JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
				WHERE hash IN (:hashes)
				GROUP BY scene_id
			)
		`)
	}

	query := "SELECT * FROM scenes WHERE " + strings.Join(clauses, " OR ")

	query, args, err := sqlx.Named(query, arg)
	if err != nil {
		return nil, err
	}
	if len(input.Fingerprints) > 0 {
		query, args, err = sqlx.In(query, args...)
		if err != nil {
			return nil, err
		}
	}
	return qb.queryScenes(query, args)
}

func (qb *sceneQueryBuilder) FindByURL(url string, limit int) ([]*models.Scene, error) {
	query := `
    SELECT S.*
		FROM scenes S
		JOIN scene_urls SU
		ON SU.scene_id = S.id
		WHERE LOWER(SU.url) = LOWER(?)
		LIMIT ?
	`
	return qb.queryScenes(query, []any{url, limit})
}
