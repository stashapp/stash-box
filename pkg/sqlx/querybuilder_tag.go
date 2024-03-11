package sqlx

import (
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	tagTable   = "tags"
	tagJoinKey = "tag_id"
)

var (
	tagDBTable = newTable(tagTable, func() interface{} {
		return &models.Tag{}
	})

	tagAliasTable = newTableJoin(tagTable, "tag_aliases", tagJoinKey, func() interface{} {
		return &models.TagAlias{}
	})

	tagRedirectTable = newTableJoin(tagTable, "tag_redirects", "source_id", func() interface{} {
		return &models.Redirect{}
	})
)

type tagQueryBuilder struct {
	dbi *dbi
}

func newTagQueryBuilder(txn *txnState) models.TagRepo {
	return &tagQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *tagQueryBuilder) toModel(ro interface{}) *models.Tag {
	if ro != nil {
		return ro.(*models.Tag)
	}

	return nil
}

func (qb *tagQueryBuilder) Create(newTag models.Tag) (*models.Tag, error) {
	ret, err := qb.dbi.Insert(tagDBTable, newTag)
	return qb.toModel(ret), err
}

func (qb *tagQueryBuilder) Update(updatedTag models.Tag) (*models.Tag, error) {
	ret, err := qb.dbi.Update(tagDBTable, updatedTag, true)
	return qb.toModel(ret), err
}

func (qb *tagQueryBuilder) UpdatePartial(updatedTag models.Tag) (*models.Tag, error) {
	ret, err := qb.dbi.Update(tagDBTable, updatedTag, false)
	return qb.toModel(ret), err
}

func (qb *tagQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, tagDBTable)
}

func (qb *tagQueryBuilder) DeleteSceneTags(id uuid.UUID) error {
	// Delete scene_tags joins
	return qb.dbi.DeleteJoins(tagSceneTable, id)
}

func (qb *tagQueryBuilder) SoftDelete(tag models.Tag) (*models.Tag, error) {
	// Delete tag aliases
	if err := qb.dbi.DeleteJoins(tagAliasTable, tag.ID); err != nil {
		return nil, err
	}
	ret, err := qb.dbi.SoftDelete(tagDBTable, tag)
	return qb.toModel(ret), err
}

func (qb *tagQueryBuilder) CreateRedirect(newJoin models.Redirect) error {
	return qb.dbi.InsertJoin(tagRedirectTable, newJoin, nil)
}

func (qb *tagQueryBuilder) UpdateRedirects(oldTargetID uuid.UUID, newTargetID uuid.UUID) error {
	query := "UPDATE " + tagRedirectTable.table.Name() + " SET target_id = ? WHERE target_id = ?"
	args := []interface{}{newTargetID, oldTargetID}
	return qb.dbi.RawQuery(tagRedirectTable.table, query, args, nil)
}

func (qb *tagQueryBuilder) UpdateSceneTags(oldTargetID uuid.UUID, newTargetID uuid.UUID) error {
	// Insert new tags for any scenes that have the old tag
	query := `INSERT INTO scene_tags (scene_id, tag_id)
            SELECT scene_id, ? 
            FROM scene_tags WHERE tag_id = ?
            ON CONFLICT DO NOTHING`
	args := []interface{}{newTargetID, oldTargetID}
	err := qb.dbi.RawQuery(sceneTagTable.table, query, args, nil)
	if err != nil {
		return err
	}

	// Delete any joins with the old tag
	query = `DELETE FROM scene_tags WHERE tag_id = ?`
	args = []interface{}{oldTargetID}
	return qb.dbi.RawQuery(sceneTagTable.table, query, args, nil)
}

func (qb *tagQueryBuilder) CreateAliases(newJoins models.TagAliases) error {
	return qb.dbi.InsertJoins(tagAliasTable, &newJoins)
}

func (qb *tagQueryBuilder) UpdateAliases(tagID uuid.UUID, updatedJoins models.TagAliases) error {
	return qb.dbi.ReplaceJoins(tagAliasTable, tagID, &updatedJoins)
}

func (qb *tagQueryBuilder) Find(id uuid.UUID) (*models.Tag, error) {
	ret, err := qb.dbi.Find(id, tagDBTable)
	return qb.toModel(ret), err
}

func (qb *tagQueryBuilder) FindByNameOrAlias(name string) (*models.Tag, error) {
	query := `
		SELECT T.* FROM tags T
		LEFT JOIN tag_aliases TA ON T.id = TA.tag_id
		WHERE (
		  LOWER(TA.alias) = LOWER($1)
			OR LOWER(T.name) = LOWER($1)
		) AND T.deleted = 'F'
	`

	args := []interface{}{name}
	results, err := qb.queryTags(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *tagQueryBuilder) FindBySceneID(sceneID uuid.UUID) ([]*models.Tag, error) {
	query := `
		SELECT tags.* FROM tags
		LEFT JOIN scene_tags as scenes_join on scenes_join.tag_id = tags.id
		WHERE scenes_join.scene_id = ?
		GROUP BY tags.id
	`
	args := []interface{}{sceneID}
	return qb.queryTags(query, args)
}

func (qb *tagQueryBuilder) FindIdsBySceneIds(ids []uuid.UUID) ([][]uuid.UUID, []error) {
	tags := models.ScenesTags{}
	err := qb.dbi.FindAllJoins(sceneTagTable, ids, &tags)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]uuid.UUID)
	for _, tag := range tags {
		m[tag.SceneID] = append(m[tag.SceneID], tag.TagID)
	}

	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *tagQueryBuilder) FindByIds(ids []uuid.UUID) ([]*models.Tag, []error) {
	query := `
		SELECT tags.* FROM tags
		WHERE id IN (?)
	`
	query, args, _ := sqlx.In(query, ids)
	tags, err := qb.queryTags(query, args)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*models.Tag)
	for _, tag := range tags {
		m[tag.ID] = tag
	}

	result := make([]*models.Tag, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *tagQueryBuilder) FindByName(name string) (*models.Tag, error) {
	query := "SELECT * FROM tags WHERE upper(name) = upper(?)"

	args := []interface{}{name}
	results, err := qb.queryTags(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *tagQueryBuilder) FindWithRedirect(id uuid.UUID) (*models.Tag, error) {
	query := `
		SELECT T.* FROM tags T
		WHERE T.id = $1 AND T.deleted = FALSE
		UNION
		SELECT T2.* FROM tag_redirects R
		JOIN tags T2 ON T2.id = R.target_id
		WHERE R.source_id = $1 AND T2.deleted = FALSE
	`
	args := []interface{}{id}
	tags, err := qb.queryTags(query, args)
	if len(tags) > 0 {
		return tags[0], err
	}
	return nil, err
}

func (qb *tagQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi, buildCountQuery("SELECT tags.id FROM tags"), nil)
}

func (qb *tagQueryBuilder) Query(filter models.TagQueryInput) ([]*models.Tag, int, error) {
	query := newQueryBuilder(tagDBTable)
	query.Eq("deleted", false)

	if q := filter.Name; q != nil && *q != "" {
		searchColumns := []string{"tags.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if q := filter.Names; q != nil && *q != "" {
		searchColumns := []string{"T.name", "TA.alias"}

		searchClause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		clause := fmt.Sprintf("EXISTS (SELECT T.id FROM tags T LEFT JOIN %[1]s TA ON T.id = TA.tag_id WHERE tags.id = T.id AND %[2]s GROUP BY T.id)", tagAliasTable.Name(), searchClause)

		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if catID := filter.CategoryID; catID != nil {
		query.Eq("tags.category_id", catID)
	}

	query.Sort = getSort(filter.Sort.String(), filter.Direction.String(), tagTable, nil)
	query.Pagination = getPagination(filter.Page, filter.PerPage)

	var tags models.Tags
	countResult, err := qb.dbi.Query(*query, &tags)
	if err != nil {
		return nil, 0, err
	}

	return tags, countResult, nil
}

func (qb *tagQueryBuilder) SearchTags(term string, limit int) ([]*models.Tag, error) {
	query := `
		SELECT T.* FROM tags T
		LEFT JOIN tag_aliases TA ON TA.tag_id = T.id
		WHERE (
			to_tsvector('english', T.name) ||
			to_tsvector('english', COALESCE(TA.alias, ''))
		) @@ plainto_tsquery($1)
		AND T.deleted = FALSE
		GROUP BY T.id
		ORDER BY T.name ASC
		LIMIT $2;
	`
	args := []interface{}{term, limit}
	return qb.queryTags(query, args)
}

func (qb *tagQueryBuilder) queryTags(query string, args []interface{}) (models.Tags, error) {
	var output models.Tags
	err := qb.dbi.RawQuery(tagDBTable, query, args, &output)
	return output, err
}

func (qb *tagQueryBuilder) GetRawAliases(id uuid.UUID) (models.TagAliases, error) {
	joins := models.TagAliases{}
	err := qb.dbi.FindJoins(tagAliasTable, id, &joins)

	return joins, err
}

func (qb *tagQueryBuilder) GetAliases(id uuid.UUID) ([]string, error) {
	joins, err := qb.GetRawAliases(id)
	return joins.ToAliases(), err
}

func (qb *tagQueryBuilder) mergeInto(sourceID uuid.UUID, targetID uuid.UUID) error {
	tag, err := qb.Find(sourceID)
	if err != nil {
		return err
	}
	if tag == nil {
		return errors.New("Merge source tag not found: " + sourceID.String())
	}
	if tag.Deleted {
		return errors.New("Merge source tag is deleted: " + sourceID.String())
	}
	_, err = qb.SoftDelete(*tag)
	if err != nil {
		return err
	}
	if err := qb.UpdateRedirects(sourceID, targetID); err != nil {
		return err
	}
	if err := qb.UpdateSceneTags(sourceID, targetID); err != nil {
		return err
	}
	redirect := models.Redirect{SourceID: sourceID, TargetID: targetID}
	return qb.CreateRedirect(redirect)
}

func (qb *tagQueryBuilder) ApplyEdit(edit models.Edit, operation models.OperationEnum, tag *models.Tag) (*models.Tag, error) {
	data, err := edit.GetTagData()
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
		newTag := models.Tag{
			ID:        UUID,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if data.New.Name == nil {
			return nil, errors.New("Missing tag name")
		}
		newTag.CopyFromTagEdit(*data.New, &models.TagEdit{})

		tag, err = qb.Create(newTag)
		if err != nil {
			return nil, err
		}

		if len(data.New.AddedAliases) > 0 {
			aliases := models.CreateTagAliases(UUID, data.New.AddedAliases)
			if err := qb.CreateAliases(aliases); err != nil {
				return nil, err
			}
		}

		return tag, nil
	case models.OperationEnumDestroy:
		updatedTag, err := qb.SoftDelete(*tag)
		if err != nil {
			return nil, err
		}
		err = qb.DeleteSceneTags(tag.ID)
		return updatedTag, err
	case models.OperationEnumModify:
		if err := tag.ValidateModifyEdit(*data); err != nil {
			return nil, err
		}

		tag.CopyFromTagEdit(*data.New, data.Old)
		updatedTag, err := qb.Update(*tag)
		if err != nil {
			return nil, err
		}

		currentAliases, err := qb.GetRawAliases(updatedTag.ID)
		if err != nil {
			return nil, err
		}
		newAliases := models.CreateTagAliases(updatedTag.ID, data.New.AddedAliases)
		if err := currentAliases.AddAliases(newAliases); err != nil {
			return nil, err
		}
		if err := currentAliases.RemoveAliases(data.New.RemovedAliases); err != nil {
			return nil, err
		}
		if err := qb.UpdateAliases(updatedTag.ID, currentAliases); err != nil {
			return nil, err
		}

		return updatedTag, err
	case models.OperationEnumMerge:
		if err := tag.ValidateModifyEdit(*data); err != nil {
			return nil, err
		}

		tag.CopyFromTagEdit(*data.New, data.Old)
		updatedTag, err := qb.Update(*tag)
		if err != nil {
			return nil, err
		}

		for _, sourceID := range data.MergeSources {
			if err := qb.mergeInto(sourceID, tag.ID); err != nil {
				return nil, err
			}
		}

		if err := qb.updateAliasesFromEdit(updatedTag, data); err != nil {
			return nil, err
		}

		return updatedTag, nil
	default:
		return nil, errors.New("Unsupported operation: " + operation.String())
	}
}

func (qb *tagQueryBuilder) GetEditAliases(id *uuid.UUID, data *models.TagEdit) ([]string, error) {
	var aliases []string
	if id != nil {
		currentAliases, err := qb.GetAliases(*id)
		if err != nil {
			return nil, err
		}
		aliases = currentAliases
	}

	return utils.ProcessSlice(aliases, data.AddedAliases, data.RemovedAliases), nil
}

func (qb *tagQueryBuilder) updateAliasesFromEdit(tag *models.Tag, data *models.TagEditData) error {
	aliases, err := qb.GetEditAliases(&tag.ID, data.New)
	if err != nil {
		return err
	}

	newAliases := models.CreateTagAliases(tag.ID, aliases)
	return qb.UpdateAliases(tag.ID, newAliases)
}
