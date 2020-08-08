package models

import (
	"errors"
	"time"

	"github.com/jmoiron/sqlx"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stashdb/pkg/database"
)

type TagQueryBuilder struct {
	dbi database.DBI
}

func NewTagQueryBuilder(tx *sqlx.Tx) TagQueryBuilder {
	return TagQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *TagQueryBuilder) toModel(ro interface{}) *Tag {
	if ro != nil {
		return ro.(*Tag)
	}

	return nil
}

func (qb *TagQueryBuilder) Create(newTag Tag) (*Tag, error) {
	ret, err := qb.dbi.Insert(newTag)
	return qb.toModel(ret), err
}

func (qb *TagQueryBuilder) Update(updatedTag Tag) (*Tag, error) {
	ret, err := qb.dbi.Update(updatedTag, false)
	return qb.toModel(ret), err
}

func (qb *TagQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, tagDBTable)
}

func (qb *TagQueryBuilder) SoftDelete(tag Tag) (*Tag, error) {
	if err := qb.dbi.DeleteJoins(tagAliasTable, tag.ID); err != nil {
		return nil, err
	}
	ret, err := qb.dbi.SoftDelete(tag)
	return qb.toModel(ret), err
}

func (qb *TagQueryBuilder) CreateRedirect(newJoin TagRedirect) error {
	return qb.dbi.InsertJoin(tagRedirectTable, newJoin, false)
}

func (qb *TagQueryBuilder) UpdateRedirects(oldTargetID uuid.UUID, newTargetID uuid.UUID) error {
	query := "UPDATE " + tagRedirectTable.Table.Name() + " SET target_id = ? WHERE target_id = ?"
	args := []interface{}{newTargetID, oldTargetID}
	return qb.dbi.RawQuery(tagRedirectTable.Table, query, args, nil)
}

func (qb *TagQueryBuilder) CreateAliases(newJoins TagAliases) error {
	return qb.dbi.InsertJoins(tagAliasTable, &newJoins)
}

func (qb *TagQueryBuilder) UpdateAliases(tagID uuid.UUID, updatedJoins TagAliases) error {
	return qb.dbi.ReplaceJoins(tagAliasTable, tagID, &updatedJoins)
}

func (qb *TagQueryBuilder) Find(id uuid.UUID) (*Tag, error) {
	ret, err := qb.dbi.Find(id, tagDBTable)
	return qb.toModel(ret), err
}

func (qb *TagQueryBuilder) FindByNameOrAlias(name string) (*Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tags.id = tag_aliases.tag_id
		WHERE tag_aliases.alias = ? OR tags.name = ?`

	args := []interface{}{name, name}
	results, err := qb.queryTags(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *TagQueryBuilder) FindBySceneID(sceneID uuid.UUID) ([]*Tag, error) {
	query := `
		SELECT tags.* FROM tags
		LEFT JOIN scene_tags as scenes_join on scenes_join.tag_id = tags.id
		LEFT JOIN scenes on scenes_join.scene_id = scenes.id
		WHERE scenes.id = ?
		GROUP BY tags.id
	`
	args := []interface{}{sceneID}
	return qb.queryTags(query, args)
}

func (qb *TagQueryBuilder) FindByNames(names []string) ([]*Tag, error) {
	query := "SELECT * FROM tags WHERE name IN " + getInBinding(len(names))
	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryTags(query, args)
}

func (qb *TagQueryBuilder) FindByAliases(names []string) ([]*Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tags.id = tag_aliases.tag_id
		WHERE tag_aliases.alias IN ` + getInBinding(len(names))

	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryTags(query, args)
}

func (qb *TagQueryBuilder) FindByName(name string) ([]*Tag, error) {
	query := "SELECT * FROM tags WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	return qb.queryTags(query, args)
}

func (qb *TagQueryBuilder) FindByAlias(name string) ([]*Tag, error) {
	query := `SELECT tags.* FROM tags
		left join tag_aliases on tag.id = tag_aliases.tag_id
		WHERE upper(tag_aliases.alias) = UPPER(?)`

	var args []interface{}
	args = append(args, name)
	return qb.queryTags(query, args)
}

func (qb *TagQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT tags.id FROM tags"), nil)
}

func (qb *TagQueryBuilder) Query(tagFilter *TagFilterType, findFilter *QuerySpec) ([]*Tag, int) {
	if tagFilter == nil {
		tagFilter = &TagFilterType{}
	}
	if findFilter == nil {
		findFilter = &QuerySpec{}
	}

	query := database.NewQueryBuilder(tagDBTable)
	query.Eq("deleted", false)

	if q := tagFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"tags.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	query.SortAndPagination = qb.getTagSort(findFilter) + getPagination(findFilter)
	var tags Tags

	countResult, err := qb.dbi.Query(*query, &tags)

	if err != nil {
		// TODO
		panic(err)
	}

	return tags, countResult
}

func (qb *TagQueryBuilder) getTagSort(findFilter *QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(sort, direction, tagTable)
}

func (qb *TagQueryBuilder) queryTags(query string, args []interface{}) (Tags, error) {
	var output Tags
	err := qb.dbi.RawQuery(tagDBTable, query, args, &output)
	return output, err
}

func (qb *TagQueryBuilder) GetRawAliases(id uuid.UUID) (TagAliases, error) {
	joins := TagAliases{}
	err := qb.dbi.FindJoins(tagAliasTable, id, &joins)

	return joins, err
}

func (qb *TagQueryBuilder) GetAliases(id uuid.UUID) ([]string, error) {
	joins, err := qb.GetRawAliases(id)
	return joins.ToAliases(), err
}

func (qb *TagQueryBuilder) MergeInto(sourceID uuid.UUID, targetID uuid.UUID) error {
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
	redirect := TagRedirect{SourceID: sourceID, TargetID: targetID}
	return qb.CreateRedirect(redirect)
}

func (qb *TagQueryBuilder) ApplyEdit(edit Edit, operation OperationEnum, tag *Tag) (*Tag, error) {
	data, err := edit.GetTagData()
	if err != nil {
		return nil, err
	}

	switch operation {
	case OperationEnumCreate:
		now := time.Now()
		UUID, err := uuid.NewV4()
		if err != nil {
			return nil, err
		}
		newTag := Tag{
			ID:        UUID,
			CreatedAt: SQLiteTimestamp{Timestamp: now},
		}
		if data.New.Name == nil {
			return nil, errors.New("Missing tag name")
		}
		newTag.CopyFromTagEdit(*data.New)

		tag, err = qb.Create(newTag)
		if err != nil {
			return nil, err
		}

		if len(data.New.AddedAliases) > 0 {
			aliases := CreateTagAliases(UUID, data.New.AddedAliases)
			if err := qb.CreateAliases(aliases); err != nil {
				return nil, err
			}
		}

		return tag, nil
	case OperationEnumDestroy:
		updatedTag, err := qb.SoftDelete(*tag)
		return updatedTag, err
	case OperationEnumModify:
		if err := tag.ValidateModifyEdit(*data); err != nil {
			return nil, err
		}

		tag.CopyFromTagEdit(*data.New)
		updatedTag, err := qb.Update(*tag)

		currentAliases, err := qb.GetRawAliases(updatedTag.ID)
		if err != nil {
			return nil, err
		}
		newAliases := CreateTagAliases(updatedTag.ID, data.New.AddedAliases)
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
	case OperationEnumMerge:
		if err := tag.ValidateModifyEdit(*data); err != nil {
			return nil, err
		}

		tag.CopyFromTagEdit(*data.New)
		updatedTag, err := qb.Update(*tag)

		for _, v := range data.MergeSources {
			sourceUUID, _ := uuid.FromString(v)
			if err := qb.MergeInto(sourceUUID, tag.ID); err != nil {
				return nil, err
			}
		}

		currentAliases, err := qb.GetRawAliases(updatedTag.ID)
		if err != nil {
			return nil, err
		}
		newAliases := CreateTagAliases(updatedTag.ID, data.New.AddedAliases)
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
