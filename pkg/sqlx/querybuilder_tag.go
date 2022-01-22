package sqlx

import (
	"errors"
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
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tags.id = tag_aliases.tag_id
		WHERE LOWER(tag_aliases.alias) = LOWER(?) OR LOWER(tags.name) = LOWER(?)`

	args := []interface{}{name, name}
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

func (qb *tagQueryBuilder) FindByNames(names []string) ([]*models.Tag, error) {
	query := "SELECT * FROM tags WHERE name IN " + getInBinding(len(names))
	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryTags(query, args)
}

func (qb *tagQueryBuilder) FindByAliases(names []string) ([]*models.Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tags.id = tag_aliases.tag_id
		WHERE tag_aliases.alias IN ` + getInBinding(len(names))

	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryTags(query, args)
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

func (qb *tagQueryBuilder) FindByAlias(name string) ([]*models.Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tag.id = tag_aliases.tag_id
		WHERE upper(tag_aliases.alias) = UPPER(?)`

	var args []interface{}
	args = append(args, name)
	return qb.queryTags(query, args)
}

func (qb *tagQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT tags.id FROM tags"), nil)
}

func (qb *tagQueryBuilder) Query(tagFilter *models.TagFilterType, findFilter *models.QuerySpec) ([]*models.Tag, int, error) {
	if tagFilter == nil {
		tagFilter = &models.TagFilterType{}
	}
	if findFilter == nil {
		findFilter = &models.QuerySpec{}
	}

	query := newQueryBuilder(tagDBTable)
	query.Eq("deleted", false)

	if q := tagFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"tags.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}
	if catID := tagFilter.CategoryID; catID != nil {
		query.Eq("tags.category_id", catID)
	}

	query.Sort = qb.getTagSort(findFilter)
	query.Pagination = getPagination(findFilter)

	var tags models.Tags
	countResult, err := qb.dbi.Query(*query, &tags)
	if err != nil {
		return nil, 0, err
	}

	return tags, countResult, nil
}

func (qb *tagQueryBuilder) getTagSort(findFilter *models.QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(qb.dbi.txn.dialect, sort, direction, tagTable, nil)
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
			CreatedAt: models.SQLiteTimestamp{Timestamp: now},
			UpdatedAt: models.SQLiteTimestamp{Timestamp: now},
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

		return updatedTag, nil
	default:
		return nil, errors.New("Unsupported operation: " + operation.String())
	}
}
