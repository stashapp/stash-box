package sqlx

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/edit"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	studioTable   = "studios"
	studioJoinKey = "studio_id"
)

var (
	studioDBTable = newTable(studioTable, func() interface{} {
		return &models.Studio{}
	})

	studioURLTable = newTableJoin(studioTable, "studio_urls", studioJoinKey, func() interface{} {
		return &models.StudioURL{}
	})

	studioRedirectTable = newTableJoin(studioTable, "studio_redirects", "source_id", func() interface{} {
		return &models.Redirect{}
	})

	studioAliasTable = newTableJoin(studioTable, "studio_aliases", studioJoinKey, func() interface{} {
		return &models.StudioAlias{}
	})
)

type studioQueryBuilder struct {
	dbi *dbi
}

func newStudioQueryBuilder(txn *txnState) models.StudioRepo {
	return &studioQueryBuilder{
		dbi: newDBI(txn),
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

func (qb *studioQueryBuilder) CreateImages(newJoins models.StudiosImages) error {
	return qb.dbi.InsertJoins(studioImageTable, &newJoins)
}

func (qb *studioQueryBuilder) UpdateImages(studioID uuid.UUID, updatedJoins models.StudiosImages) error {
	return qb.dbi.ReplaceJoins(studioImageTable, studioID, &updatedJoins)
}

func (qb *studioQueryBuilder) UpdateURLs(studioID uuid.UUID, updatedJoins models.StudioURLs) error {
	return qb.dbi.ReplaceJoins(studioURLTable, studioID, &updatedJoins)
}

func (qb *studioQueryBuilder) Find(id uuid.UUID) (*models.Studio, error) {
	ret, err := qb.dbi.Find(id, studioDBTable)
	return qb.toModel(ret), err
}

func (qb *studioQueryBuilder) FindByIds(ids []uuid.UUID) ([]*models.Studio, []error) {
	query := `
		SELECT studios.* FROM studios
		WHERE id IN (?)
	`
	query, args, _ := sqlx.In(query, ids)
	studios, err := qb.queryStudios(query, args)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*models.Studio)
	for _, studio := range studios {
		m[studio.ID] = studio
	}

	result := make([]*models.Studio, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *studioQueryBuilder) FindWithRedirect(id uuid.UUID) (*models.Studio, error) {
	query := `
		SELECT S.* FROM studios S
		WHERE S.id = $1 AND S.deleted = FALSE
		UNION
		SELECT T.* FROM studio_redirects R
		JOIN studios T ON T.id = R.target_id
		WHERE R.source_id = $1 AND T.deleted = FALSE
	`
	args := []interface{}{id}
	studios, err := qb.queryStudios(query, args)
	if len(studios) > 0 {
		return studios[0], err
	}
	return nil, err
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

func (qb *studioQueryBuilder) FindByName(name string) (*models.Studio, error) {
	query := "SELECT * FROM studios WHERE upper(name) = upper(?) AND deleted = FALSE"
	var args []interface{}
	args = append(args, name)
	results, err := qb.queryStudios(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *studioQueryBuilder) FindByParentID(id uuid.UUID) (models.Studios, error) {
	query := "SELECT * FROM studios WHERE parent_studio_id = ? AND deleted = FALSE"
	var args []interface{}
	args = append(args, id)
	return qb.queryStudios(query, args)
}

func (qb *studioQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi, buildCountQuery("SELECT studios.id FROM studios"), nil)
}

func (qb *studioQueryBuilder) Query(filter models.StudioQueryInput, userID uuid.UUID) (models.Studios, int, error) {
	query := newQueryBuilder(studioDBTable)
	query.Body += "LEFT JOIN studios as parent_studio ON studios.parent_studio_id = parent_studio.id"

	if q := filter.URL; q != nil && *q != "" {
		where := fmt.Sprintf("%s.url = ?", studioURLTable.Name())
		query.AddJoinTableFilter(studioURLTable, where, false, nil, false, *q)
	}

	if q := filter.Name; q != nil && *q != "" {
		searchColumns := []string{"studios.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if q := filter.Names; q != nil && *q != "" {
		searchColumns := []string{"studios.name", "parent_studio.name", "SA.alias"}
		searchClause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		clause := fmt.Sprintf("EXISTS (SELECT S.id FROM studios S LEFT JOIN %[1]s SA ON S.id = SA.studio_id WHERE studios.id = S.id AND %[2]s GROUP BY S.id)", studioAliasTable.Name(), searchClause)

		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if filter.HasParent != nil {
		if *filter.HasParent {
			query.AddWhere("parent_studio.id IS NOT NULL")
		} else {
			query.AddWhere("parent_studio.id IS NULL")
		}
	}

	if filter.IsFavorite != nil {
		// userID is internal based on user context so it is safe to append rather than bind
		q := fmt.Sprintf(" JOIN studio_favorites F ON studios.id = F.studio_id AND F.user_id = '%s'", userID)
		if *filter.IsFavorite {
			query.Body += q
		} else {
			query.Body += " LEFT" + q
			query.AddWhere("F.studio_id IS NULL")
		}
	}

	query.Sort = qb.getStudioSort(filter)
	query.Pagination = getPagination(filter.Page, filter.PerPage)

	query.Eq("studios.deleted", false)

	var studios models.Studios
	countResult, err := qb.dbi.Query(*query, &studios)

	return studios, countResult, err
}

func (qb *studioQueryBuilder) getStudioSort(filter models.StudioQueryInput) string {
	secondary := "id"
	return getSort(filter.Sort.String(), filter.Direction.String(), "studios", &secondary)
}

func (qb *studioQueryBuilder) queryStudios(query string, args []interface{}) (models.Studios, error) {
	var output models.Studios
	err := qb.dbi.RawQuery(studioDBTable, query, args, &output)
	return output, err
}

func (qb *studioQueryBuilder) GetImages(id uuid.UUID) (models.StudiosImages, error) {
	joins := models.StudiosImages{}
	err := qb.dbi.FindJoins(studioImageTable, id, &joins)

	return joins, err
}

func (qb *studioQueryBuilder) SearchStudios(term string, limit int) (models.Studios, error) {
	query := `
		SELECT S.* FROM (
			SELECT id, SUM(similarity) AS score FROM (
				SELECT S.id, similarity(S.name, $1) AS similarity
				FROM studios S
				WHERE S.deleted = FALSE AND S.name % $1 AND similarity(S.name, $1) > 0.5
			UNION
				SELECT S.id, (similarity(COALESCE(SA.alias, ''), $1) * 0.5) AS similarity
				FROM studios S
				LEFT JOIN studio_aliases SA on SA.studio_id = S.id
				WHERE S.deleted = FALSE AND SA.alias % $1 AND similarity(COALESCE(SA.alias, ''), $1) > 0.5
			) A
			GROUP BY id
			ORDER BY score DESC
			LIMIT $2
		) T
		JOIN studios S ON S.id = T.id
		ORDER BY score DESC;
	`
	args := []interface{}{term, limit}
	return qb.queryStudios(query, args)
}

func (qb *studioQueryBuilder) GetURLs(id uuid.UUID) ([]*models.URL, error) {
	joins := models.StudioURLs{}
	err := qb.dbi.FindJoins(studioURLTable, id, &joins)

	urls := make([]*models.URL, len(joins))
	for i, u := range joins {
		url := models.URL{
			URL:    u.URL,
			SiteID: u.SiteID,
		}
		urls[i] = &url
	}

	return urls, err
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
			URL:    join.URL,
			SiteID: join.SiteID,
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
	if err := qb.dbi.db().SelectContext(qb.dbi.txn.ctx, &results, query, performerID); err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	return results, nil
}

func (qb *studioQueryBuilder) ApplyEdit(edit models.Edit, operation models.OperationEnum, studio *models.Studio) (*models.Studio, error) {
	data, err := edit.GetStudioData()
	if err != nil {
		return nil, err
	}

	switch operation {
	case models.OperationEnumCreate:
		now := time.Now()
		UUID, err := uuid.NewV4()
		if err != nil {
			return nil, err
		}
		newStudio := models.Studio{
			ID:        UUID,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if data.New.Name == nil {
			return nil, errors.New("missing studio name")
		}
		newStudio.CopyFromStudioEdit(*data.New, &models.StudioEdit{})

		studio, err = qb.Create(newStudio)
		if err != nil {
			return nil, err
		}

		if len(data.New.AddedUrls) > 0 {
			urls := models.CreateStudioURLs(UUID, data.New.AddedUrls)
			if err := qb.CreateURLs(urls); err != nil {
				return nil, err
			}
		}

		if len(data.New.AddedImages) > 0 {
			images := models.CreateStudioImages(UUID, data.New.AddedImages)
			if err := qb.CreateImages(images); err != nil {
				return nil, err
			}
		}

		if len(data.New.AddedAliases) > 0 {
			aliases := models.CreateStudioAliases(UUID, data.New.AddedAliases)
			if err := qb.CreateAliases(aliases); err != nil {
				return nil, err
			}
		}

		return studio, nil
	case models.OperationEnumDestroy:
		updatedStudio, err := qb.SoftDelete(*studio)
		if err != nil {
			return nil, err
		}

		if err = qb.deleteSceneStudios(studio.ID); err != nil {
			return nil, err
		}
		if err = qb.deleteStudioFavorites(studio.ID); err != nil {
			return nil, err
		}

		return updatedStudio, nil
	case models.OperationEnumModify:
		return qb.applyModifyEdit(studio, data)
	case models.OperationEnumMerge:
		updatedStudio, err := qb.applyModifyEdit(studio, data)
		if err != nil {
			return nil, err
		}

		for _, sourceID := range data.MergeSources {
			if err := qb.mergeInto(sourceID, studio.ID); err != nil {
				return nil, err
			}
		}

		return updatedStudio, nil
	default:
		return nil, errors.New("Unsupported operation: " + operation.String())
	}
}

func (qb *studioQueryBuilder) applyModifyEdit(studio *models.Studio, data *models.StudioEditData) (*models.Studio, error) {
	if err := studio.ValidateModifyEdit(*data); err != nil {
		return nil, err
	}

	studio.CopyFromStudioEdit(*data.New, data.Old)
	updatedStudio, err := qb.Update(*studio)
	if err != nil {
		return nil, err
	}

	if err := qb.updateURLsFromEdit(updatedStudio, data); err != nil {
		return nil, err
	}

	if err := qb.updateImagesFromEdit(updatedStudio, data); err != nil {
		return nil, err
	}

	if err := qb.updateAliasesFromEdit(updatedStudio, data); err != nil {
		return nil, err
	}

	return updatedStudio, err
}

func (qb *studioQueryBuilder) GetEditURLs(id *uuid.UUID, data *models.StudioEdit) ([]*models.URL, error) {
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

func (qb *studioQueryBuilder) updateURLsFromEdit(studio *models.Studio, data *models.StudioEditData) error {
	urls, err := qb.GetEditURLs(&studio.ID, data.New)
	if err != nil {
		return err
	}

	newURLs := models.CreateStudioURLs(studio.ID, urls)
	return qb.UpdateURLs(studio.ID, newURLs)
}

func (qb *studioQueryBuilder) GetEditImages(id *uuid.UUID, data *models.StudioEdit) ([]uuid.UUID, error) {
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

func (qb *studioQueryBuilder) updateImagesFromEdit(studio *models.Studio, data *models.StudioEditData) error {
	ids, err := qb.GetEditImages(&studio.ID, data.New)
	if err != nil {
		return err
	}

	images := models.CreateStudioImages(studio.ID, ids)
	return qb.UpdateImages(studio.ID, images)
}

func (qb *studioQueryBuilder) mergeInto(sourceID uuid.UUID, targetID uuid.UUID) error {
	studio, err := qb.Find(sourceID)
	if err != nil {
		return err
	}
	if studio == nil {
		return errors.New("Merge source studio not found: " + sourceID.String())
	}
	if studio.Deleted {
		return errors.New("Merge source studio is deleted: " + sourceID.String())
	}
	_, err = qb.SoftDelete(*studio)
	if err != nil {
		return err
	}
	if err := qb.UpdateRedirects(sourceID, targetID); err != nil {
		return err
	}
	if err := qb.updateSceneStudios(sourceID, targetID); err != nil {
		return err
	}
	if err := qb.reassignFavorites(sourceID, targetID); err != nil {
		return err
	}

	redirect := models.Redirect{SourceID: sourceID, TargetID: targetID}
	return qb.CreateRedirect(redirect)
}

func (qb *studioQueryBuilder) CreateRedirect(newJoin models.Redirect) error {
	return qb.dbi.InsertJoin(studioRedirectTable, newJoin, nil)
}

func (qb *studioQueryBuilder) UpdateRedirects(oldTargetID uuid.UUID, newTargetID uuid.UUID) error {
	query := "UPDATE " + studioRedirectTable.Name() + " SET target_id = ? WHERE target_id = ?"
	args := []interface{}{newTargetID, oldTargetID}
	return qb.dbi.RawQuery(studioRedirectTable.table, query, args, nil)
}

func (qb *studioQueryBuilder) SoftDelete(studio models.Studio) (*models.Studio, error) {
	ret, err := qb.dbi.SoftDelete(studioDBTable, studio)
	return qb.toModel(ret), err
}

func (qb *studioQueryBuilder) updateSceneStudios(oldTargetID uuid.UUID, newTargetID uuid.UUID) error {
	// set existing studio ids to the new id
	query := `UPDATE ` + sceneDBTable.Name() + ` SET studio_id = ? WHERE studio_id = ?`
	args := []interface{}{newTargetID, oldTargetID}

	return qb.dbi.RawExec(query, args)
}

func (qb *studioQueryBuilder) reassignFavorites(oldTargetID uuid.UUID, newTargetID uuid.UUID) error {
	// Reassign performer favorites to new id where it isn't already assigned
	query := `UPDATE studio_favorites
					 SET studio_id = ?
					 WHERE studio_id = ?
					 AND user_id NOT IN (SELECT user_id from studio_favorites WHERE studio_id = ?)`
	args := []interface{}{newTargetID, oldTargetID, newTargetID}
	err := qb.dbi.RawQuery(performerFavoriteTable.table, query, args, nil)
	if err != nil {
		return err
	}

	// Delete any remaining joins with the old performer
	query = `DELETE FROM studio_favorites WHERE studio_id = ?`
	args = []interface{}{oldTargetID}
	return qb.dbi.RawQuery(studioFavoriteTable.table, query, args, nil)
}

func (qb *studioQueryBuilder) deleteSceneStudios(id uuid.UUID) error {
	// set existing studio ids to null
	query := `UPDATE ` + sceneDBTable.Name() + ` SET studio_id = NULL WHERE studio_id = ?`
	args := []interface{}{id}

	return qb.dbi.RawExec(query, args)
}

func (qb *studioQueryBuilder) deleteStudioFavorites(id uuid.UUID) error {
	return qb.dbi.DeleteJoins(studioFavoriteTable, id)
}

func (qb *studioQueryBuilder) IsFavoriteByIds(userID uuid.UUID, ids []uuid.UUID) ([]bool, []error) {
	query := "SELECT studio_id FROM studio_favorites WHERE user_id = :userid AND studio_id IN (:studio_ids)"

	arg := map[string]interface{}{
		"userid":     userID,
		"studio_ids": ids,
	}
	m := make(map[uuid.UUID]bool)

	query, args, err := sqlx.Named(query, arg)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	if err := qb.dbi.queryFunc(query, args, func(rows *sqlx.Rows) error {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return err
		}
		m[id] = true

		return nil
	}); err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	result := make([]bool, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *studioQueryBuilder) CreateAliases(newJoins models.StudioAliases) error {
	return qb.dbi.InsertJoins(studioAliasTable, &newJoins)
}

func (qb *studioQueryBuilder) UpdateAliases(studioID uuid.UUID, updatedJoins models.StudioAliases) error {
	return qb.dbi.ReplaceJoins(studioAliasTable, studioID, &updatedJoins)
}

func (qb *studioQueryBuilder) GetAliases(id uuid.UUID) (models.StudioAliases, error) {
	joins := models.StudioAliases{}
	err := qb.dbi.FindJoins(studioAliasTable, id, &joins)

	return joins, err
}

func (qb *studioQueryBuilder) GetAllAliases(ids []uuid.UUID) ([][]string, []error) {
	joins := models.StudioAliases{}
	err := qb.dbi.FindAllJoins(studioAliasTable, ids, &joins)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]string)
	for _, join := range joins {
		m[join.StudioID] = append(m[join.StudioID], join.Alias)
	}

	result := make([][]string, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *studioQueryBuilder) GetEditAliases(id *uuid.UUID, data *models.StudioEdit) ([]string, error) {
	var aliases []string
	if id != nil {
		currentAliases, err := qb.GetAliases(*id)
		if err != nil {
			return nil, err
		}
		for _, v := range currentAliases {
			aliases = append(aliases, v.Alias)
		}
	}

	return utils.ProcessSlice(aliases, data.AddedAliases, data.RemovedAliases), nil
}

func (qb *studioQueryBuilder) updateAliasesFromEdit(studio *models.Studio, data *models.StudioEditData) error {
	aliases, err := qb.GetEditAliases(&studio.ID, data.New)
	if err != nil {
		return err
	}

	newAliases := models.CreateStudioAliases(studio.ID, aliases)
	return qb.UpdateAliases(studio.ID, newAliases)
}
