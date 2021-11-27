package sqlx

import (
	"errors"
	"strconv"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"

	"github.com/gofrs/uuid"
)

const (
	performerTable   = "performers"
	performerJoinKey = "performer_id"
)

var (
	performerDBTable = newTable(performerTable, func() interface{} {
		return &models.Performer{}
	})

	performerAliasTable = newTableJoin(performerTable, "performer_aliases", performerJoinKey, func() interface{} {
		return &models.PerformerAlias{}
	})

	performerURLTable = newTableJoin(performerTable, "performer_urls", performerJoinKey, func() interface{} {
		return &models.PerformerURL{}
	})

	performerTattooTable = newTableJoin(performerTable, "performer_tattoos", performerJoinKey, func() interface{} {
		return &models.PerformerBodyMod{}
	})

	performerPiercingTable = newTableJoin(performerTable, "performer_piercings", performerJoinKey, func() interface{} {
		return &models.PerformerBodyMod{}
	})

	performerSourceRedirectTable = newTableJoin(performerTable, "performer_redirects", "source_id", func() interface{} {
		return &models.Redirect{}
	})
	performerTargetRedirectTable = newTableJoin(performerTable, "performer_redirects", "target_id", func() interface{} {
		return &models.Redirect{}
	})
)

type performerQueryBuilder struct {
	dbi *dbi
}

func newPerformerQueryBuilder(txn *txnState) models.PerformerRepo {
	return &performerQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *performerQueryBuilder) toModel(ro interface{}) *models.Performer {
	if ro != nil {
		return ro.(*models.Performer)
	}

	return nil
}

func (qb *performerQueryBuilder) Create(newPerformer models.Performer) (*models.Performer, error) {
	ret, err := qb.dbi.Insert(performerDBTable, newPerformer)
	return qb.toModel(ret), err
}

func (qb *performerQueryBuilder) Update(updatedPerformer models.Performer) (*models.Performer, error) {
	ret, err := qb.dbi.Update(performerDBTable, updatedPerformer, true)
	return qb.toModel(ret), err
}

func (qb *performerQueryBuilder) UpdatePartial(updatedPerformer models.Performer) (*models.Performer, error) {
	ret, err := qb.dbi.Update(performerDBTable, updatedPerformer, false)
	return qb.toModel(ret), err
}

func (qb *performerQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, performerDBTable)
}

func (qb *performerQueryBuilder) CreateAliases(newJoins models.PerformerAliases) error {
	return qb.dbi.InsertJoins(performerAliasTable, &newJoins)
}

func (qb *performerQueryBuilder) UpdateAliases(performerID uuid.UUID, updatedJoins models.PerformerAliases) error {
	return qb.dbi.ReplaceJoins(performerAliasTable, performerID, &updatedJoins)
}

func (qb *performerQueryBuilder) CreateUrls(newJoins models.PerformerURLs) error {
	return qb.dbi.InsertJoins(performerURLTable, &newJoins)
}

func (qb *performerQueryBuilder) CreateImages(newJoins models.PerformersImages) error {
	return qb.dbi.InsertJoins(performerImageTable, &newJoins)
}

func (qb *performerQueryBuilder) UpdateImages(performerID uuid.UUID, updatedJoins models.PerformersImages) error {
	return qb.dbi.ReplaceJoins(performerImageTable, performerID, &updatedJoins)
}

func (qb *performerQueryBuilder) UpdateUrls(performerID uuid.UUID, updatedJoins models.PerformerURLs) error {
	return qb.dbi.ReplaceJoins(performerURLTable, performerID, &updatedJoins)
}

func (qb *performerQueryBuilder) CreateTattoos(newJoins models.PerformerBodyMods) error {
	return qb.dbi.InsertJoins(performerTattooTable, &newJoins)
}

func (qb *performerQueryBuilder) UpdateTattoos(performerID uuid.UUID, updatedJoins models.PerformerBodyMods) error {
	return qb.dbi.ReplaceJoins(performerTattooTable, performerID, &updatedJoins)
}

func (qb *performerQueryBuilder) CreatePiercings(newJoins models.PerformerBodyMods) error {
	return qb.dbi.InsertJoins(performerPiercingTable, &newJoins)
}

func (qb *performerQueryBuilder) UpdatePiercings(performerID uuid.UUID, updatedJoins models.PerformerBodyMods) error {
	return qb.dbi.ReplaceJoins(performerPiercingTable, performerID, &updatedJoins)
}

func (qb *performerQueryBuilder) Find(id uuid.UUID) (*models.Performer, error) {
	ret, err := qb.dbi.Find(id, performerDBTable)
	return qb.toModel(ret), err
}

func (qb *performerQueryBuilder) FindByIds(ids []uuid.UUID) ([]*models.Performer, []error) {
	query := "SELECT performers.* FROM performers WHERE id IN (?)"
	query, args, _ := sqlx.In(query, ids)
	performers, err := qb.queryPerformers(query, args)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*models.Performer)
	for _, performer := range performers {
		m[performer.ID] = performer
	}

	result := make([]*models.Performer, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *performerQueryBuilder) FindBySceneID(sceneID uuid.UUID) (models.Performers, error) {
	query := `
		SELECT performers.* FROM performers
		LEFT JOIN performers_scenes as scenes_join on scenes_join.performer_id = performers.id
		WHERE scenes_join.scene_id = ?
		GROUP BY performers.id
	`
	args := []interface{}{sceneID}
	return qb.queryPerformers(query, args)
}

func (qb *performerQueryBuilder) FindByNames(names []string) (models.Performers, error) {
	query := "SELECT * FROM performers WHERE name IN " + getInBinding(len(names))
	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryPerformers(query, args)
}

func (qb *performerQueryBuilder) FindByAliases(names []string) (models.Performers, error) {
	query := `SELECT performers.* FROM performers
		left join performer_aliases on performers.id = performer_aliases.performer_id
		WHERE performer_aliases.alias IN ` + getInBinding(len(names))

	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryPerformers(query, args)
}

func (qb *performerQueryBuilder) FindByName(name string) (models.Performers, error) {
	query := "SELECT * FROM performers WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	return qb.queryPerformers(query, args)
}

func (qb *performerQueryBuilder) FindByAlias(name string) (models.Performers, error) {
	query := `SELECT performers.* FROM performers
		left join performer_aliases on performers.id = performer_aliases.performer_id
		WHERE upper(performer_aliases.alias) = UPPER(?)`

	var args []interface{}
	args = append(args, name)
	return qb.queryPerformers(query, args)
}

func (qb *performerQueryBuilder) Count() (int, error) {
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT performers.id FROM performers"), nil)
}

func (qb *performerQueryBuilder) buildQuery(performerFilter *models.PerformerFilterType, findFilter *models.QuerySpec) *queryBuilder {
	if performerFilter == nil {
		performerFilter = &models.PerformerFilterType{}
	}
	if findFilter == nil {
		findFilter = &models.QuerySpec{}
	}

	query := newQueryBuilder(performerDBTable)
	query.Eq("deleted", false)

	if q := performerFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"performers.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if birthYear := performerFilter.BirthYear; birthYear != nil {
		clauses, thisArgs := getBirthYearFilterClause(birthYear.Modifier, birthYear.Value)
		query.AddWhere(clauses...)
		query.AddArg(thisArgs...)
	}

	if age := performerFilter.Age; age != nil {
		clauses, thisArgs := getAgeFilterClause(age.Modifier, age.Value)
		query.AddWhere(clauses...)
		query.AddArg(thisArgs...)
	}

	if q := performerFilter.Gender; q != nil && *q != "" {
		if *q == models.GenderFilterEnumUnknown {
			query.AddWhere("performers.gender IS NULL")
		} else {
			query.Eq("performers.gender", q.String())
		}
	}

	if q := performerFilter.Ethnicity; q != nil && *q != "" {
		if *q == models.EthnicityFilterEnumUnknown {
			query.AddWhere("performers.ethnicity IS NULL")
		} else {
			query.Eq("performers.ethnicity", q.String())
		}
	}

	handleStringCriterion("country", performerFilter.Country, query)
	/*
		handleStringCriterion("eye_color", performerFilter.EyeColor, &query)
		handleStringCriterion("height", performerFilter.Height, &query)
		handleStringCriterion("measurements", performerFilter.Measurements, &query)
		handleStringCriterion("fake_tits", performerFilter.FakeTits, &query)
		handleStringCriterion("career_length", performerFilter.CareerLength, &query)
		handleStringCriterion("tattoos", performerFilter.Tattoos, &query)
		handleStringCriterion("piercings", performerFilter.Piercings, &query)
		handleStringCriterion("aliases", performerFilter.Aliases, &query)
	*/

	switch {
	case findFilter != nil && findFilter.GetSort("") == "debut":
		query.Body += `
			JOIN (SELECT performer_id, MIN(date) as debut FROM scene_performers JOIN scenes ON scene_id = id GROUP BY performer_id) D
			ON performers.id = D.performer_id
		`
		direction := findFilter.GetDirection() + qb.dbi.txn.dialect.NullsLast()
		query.Sort = "ORDER BY debut " + direction + ", name " + direction
	case findFilter != nil && findFilter.GetSort("") == "scene_count":
		query.Body += `
			JOIN (SELECT performer_id, COUNT(*) as scene_count FROM scene_performers GROUP BY performer_id) D
			ON performers.id = D.performer_id
		`
		direction := findFilter.GetDirection() + qb.dbi.txn.dialect.NullsLast()
		query.Sort = " ORDER BY scene_count " + direction + ", name " + direction
	default:
		query.Sort = qb.getPerformerSort(findFilter)
	}

	return query
}

func (qb *performerQueryBuilder) QueryPerformers(performerFilter *models.PerformerFilterType, findFilter *models.QuerySpec) ([]*models.Performer, error) {
	query := qb.buildQuery(performerFilter, findFilter)
	query.Pagination = getPagination(findFilter)

	var performers models.Performers
	err := qb.dbi.QueryOnly(*query, &performers)
	return performers, err
}

func (qb *performerQueryBuilder) QueryCount(performerFilter *models.PerformerFilterType, findFilter *models.QuerySpec) (int, error) {
	query := qb.buildQuery(performerFilter, findFilter)
	return qb.dbi.CountOnly(*query)
}

func getBirthYearFilterClause(criterionModifier models.CriterionModifier, value int) ([]string, []interface{}) {
	var clauses []string
	var args []interface{}

	yearStr := strconv.Itoa(value)
	startOfYear := yearStr + "-01-01"
	endOfYear := yearStr + "-12-31"

	if modifier := criterionModifier.String(); criterionModifier.IsValid() {
		switch modifier {
		case "EQUALS":
			// between yyyy-01-01 and yyyy-12-31
			clauses = append(clauses, "performers.birthdate >= ?")
			clauses = append(clauses, "performers.birthdate <= ?")
			args = append(args, startOfYear)
			args = append(args, endOfYear)
		case "NOT_EQUALS":
			// outside of yyyy-01-01 to yyyy-12-31
			clauses = append(clauses, "performers.birthdate < ? OR performers.birthdate > ?")
			args = append(args, startOfYear)
			args = append(args, endOfYear)
		case "GREATER_THAN":
			// > yyyy-12-31
			clauses = append(clauses, "performers.birthdate > ?")
			args = append(args, endOfYear)
		case "LESS_THAN":
			// < yyyy-01-01
			clauses = append(clauses, "performers.birthdate < ?")
			args = append(args, startOfYear)
		}
	}

	return clauses, args
}

func getAgeFilterClause(criterionModifier models.CriterionModifier, value int) ([]string, []interface{}) {
	var clauses []string
	var args []interface{}

	// get the date at which performer would turn the age specified
	dt := time.Now()
	birthDate := dt.AddDate(-value-1, 0, 0)
	yearAfter := birthDate.AddDate(1, 0, 0)

	if modifier := criterionModifier.String(); criterionModifier.IsValid() {
		switch modifier {
		case "EQUALS":
			// between birthDate and yearAfter
			clauses = append(clauses, "performers.birthdate >= ?")
			clauses = append(clauses, "performers.birthdate < ?")
			args = append(args, birthDate)
			args = append(args, yearAfter)
		case "NOT_EQUALS":
			// outside of birthDate and yearAfter
			clauses = append(clauses, "performers.birthdate < ? OR performers.birthdate >= ?")
			args = append(args, birthDate)
			args = append(args, yearAfter)
		case "GREATER_THAN":
			// < birthDate
			clauses = append(clauses, "performers.birthdate < ?")
			args = append(args, birthDate)
		case "LESS_THAN":
			// > yearAfter
			clauses = append(clauses, "performers.birthdate >= ?")
			args = append(args, yearAfter)
		}
	}

	return clauses, args
}

func (qb *performerQueryBuilder) getPerformerSort(findFilter *models.QuerySpec) string {
	var sort string
	var direction string
	var secondary *string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	if sort != "name" {
		name := "name"
		secondary = &name
	}
	return getSort(qb.dbi.txn.dialect, sort, direction, "performers", secondary)
}

func (qb *performerQueryBuilder) queryPerformers(query string, args []interface{}) (models.Performers, error) {
	output := models.Performers{}
	err := qb.dbi.RawQuery(performerDBTable, query, args, &output)
	return output, err
}

func (qb *performerQueryBuilder) GetAliases(id uuid.UUID) (models.PerformerAliases, error) {
	joins := models.PerformerAliases{}
	err := qb.dbi.FindJoins(performerAliasTable, id, &joins)

	return joins, err
}

func (qb *performerQueryBuilder) GetImages(id uuid.UUID) (models.PerformersImages, error) {
	joins := models.PerformersImages{}
	err := qb.dbi.FindJoins(performerImageTable, id, &joins)

	return joins, err
}

func (qb *performerQueryBuilder) GetAllAliases(ids []uuid.UUID) ([][]string, []error) {
	joins := models.PerformerAliases{}
	err := qb.dbi.FindAllJoins(performerAliasTable, ids, &joins)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]string)
	for _, join := range joins {
		m[join.PerformerID] = append(m[join.PerformerID], join.Alias)
	}

	result := make([][]string, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *performerQueryBuilder) GetURLs(id uuid.UUID) ([]*models.URL, error) {
	joins := models.PerformerURLs{}
	err := qb.dbi.FindJoins(performerURLTable, id, &joins)

	urls := make([]*models.URL, len(joins))
	for i, u := range joins {
		url := models.URL{
			URL:  u.URL,
			Type: u.Type,
		}
		urls[i] = &url
	}

	return urls, err
}

func (qb *performerQueryBuilder) GetAllURLs(ids []uuid.UUID) ([][]*models.URL, []error) {
	joins := models.PerformerURLs{}
	err := qb.dbi.FindAllJoins(performerURLTable, ids, &joins)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]*models.URL)
	for _, join := range joins {
		url := models.URL{
			URL:  join.URL,
			Type: join.Type,
		}
		m[join.PerformerID] = append(m[join.PerformerID], &url)
	}

	result := make([][]*models.URL, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *performerQueryBuilder) GetTattoos(id uuid.UUID) (models.PerformerBodyMods, error) {
	joins := models.PerformerBodyMods{}
	err := qb.dbi.FindJoins(performerTattooTable, id, &joins)

	return joins, err
}

func (qb *performerQueryBuilder) GetAllTattoos(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
	joins := models.PerformerBodyMods{}
	err := qb.dbi.FindAllJoins(performerTattooTable, ids, &joins)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]*models.BodyModification)
	for _, join := range joins {
		desc := &join.Description.String
		if !join.Description.Valid {
			desc = nil
		}
		mod := models.BodyModification{
			Location:    join.Location,
			Description: desc,
		}
		m[join.PerformerID] = append(m[join.PerformerID], &mod)
	}

	result := make([][]*models.BodyModification, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *performerQueryBuilder) GetPiercings(id uuid.UUID) (models.PerformerBodyMods, error) {
	joins := models.PerformerBodyMods{}
	err := qb.dbi.FindJoins(performerPiercingTable, id, &joins)

	return joins, err
}

func (qb *performerQueryBuilder) GetAllPiercings(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
	joins := models.PerformerBodyMods{}
	err := qb.dbi.FindAllJoins(performerPiercingTable, ids, &joins)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]*models.BodyModification)
	for _, join := range joins {
		desc := &join.Description.String
		if !join.Description.Valid {
			desc = nil
		}
		mod := models.BodyModification{
			Location:    join.Location,
			Description: desc,
		}
		m[join.PerformerID] = append(m[join.PerformerID], &mod)
	}

	result := make([][]*models.BodyModification, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *performerQueryBuilder) SearchPerformers(term string, limit int) (models.Performers, error) {
	query := `
	SELECT DISTINCT ON (T.id) T.* FROM (
		SELECT P.* FROM performers P
		LEFT JOIN performer_aliases PA on PA.performer_id = P.id
		WHERE
			P.deleted = FALSE AND (
				(P.name % $1 AND similarity(P.name, $1) > 0.5)
				OR (PA.alias % $1 AND similarity(PA.alias, $1) > 0.6)
				OR (P.disambiguation % $1 AND similarity(P.disambiguation, $1) > 0.7)
			)
		ORDER BY
			similarity(P.name, $1) DESC,
			similarity(PA.alias, $1) DESC,
			similarity(P.disambiguation, $1) DESC
	) T LIMIT $2`
	args := []interface{}{term, limit}
	return qb.queryPerformers(query, args)
}

func (qb *performerQueryBuilder) DeleteScenePerformers(id uuid.UUID) error {
	// Delete scene_performers joins
	return qb.dbi.DeleteJoins(performerSceneTable, id)
}

func (qb *performerQueryBuilder) SoftDelete(performer models.Performer) (*models.Performer, error) {
	// Delete joins
	if err := qb.dbi.DeleteJoins(performerAliasTable, performer.ID); err != nil {
		return nil, err
	}
	if err := qb.dbi.DeleteJoins(performerPiercingTable, performer.ID); err != nil {
		return nil, err
	}
	if err := qb.dbi.DeleteJoins(performerTattooTable, performer.ID); err != nil {
		return nil, err
	}
	if err := qb.dbi.DeleteJoins(performerURLTable, performer.ID); err != nil {
		return nil, err
	}
	if err := qb.dbi.DeleteJoins(performerImageTable, performer.ID); err != nil {
		return nil, err
	}

	ret, err := qb.dbi.SoftDelete(performerDBTable, performer)
	return qb.toModel(ret), err
}

func (qb *performerQueryBuilder) CreateRedirect(newJoin models.Redirect) error {
	return qb.dbi.InsertJoin(performerSourceRedirectTable, newJoin, nil)
}

func (qb *performerQueryBuilder) UpdateRedirects(oldTargetID uuid.UUID, newTargetID uuid.UUID) error {
	query := "UPDATE " + performerSourceRedirectTable.table.Name() + " SET target_id = ? WHERE target_id = ?"
	args := []interface{}{newTargetID, oldTargetID}
	return qb.dbi.RawQuery(performerSourceRedirectTable.table, query, args, nil)
}

func (qb *performerQueryBuilder) UpdateScenePerformers(oldPerformer *models.Performer, newTargetID uuid.UUID, setAliases bool) error {
	// Set old name as scene performance alias where one isn't already set
	if setAliases {
		if err := qb.UpdateScenePerformerAlias(oldPerformer.ID, oldPerformer.Name); err != nil {
			return err
		}
	}

	// Reassign scene performances to new id where it isn't already assigned
	query := `UPDATE scene_performers
					 SET performer_id = ?
					 WHERE performer_id = ?
					 AND scene_id NOT IN (SELECT scene_id from scene_performers WHERE performer_id = ?)`
	args := []interface{}{newTargetID, oldPerformer.ID, newTargetID}
	err := qb.dbi.RawQuery(scenePerformerTable.table, query, args, nil)
	if err != nil {
		return err
	}

	// Delete any remaining joins with the old performer
	query = `DELETE FROM scene_performers WHERE performer_id = ?`
	args = []interface{}{oldPerformer.ID}
	return qb.dbi.RawQuery(scenePerformerTable.table, query, args, nil)
}

func (qb *performerQueryBuilder) UpdateScenePerformerAlias(performerID uuid.UUID, name string) error {
	query := `UPDATE scene_performers
            SET "as" = ?
            WHERE performer_id = ?
            AND "as" IS NULL`
	args := []interface{}{name, performerID}
	err := qb.dbi.RawQuery(scenePerformerTable.table, query, args, nil)
	if err != nil {
		return err
	}
	return nil
}

func (qb *performerQueryBuilder) mergeInto(sourceID uuid.UUID, targetID uuid.UUID, setAliases bool) error {
	performer, err := qb.Find(sourceID)
	if err != nil {
		return err
	}
	if performer == nil {
		return errors.New("Merge source performer not found: " + sourceID.String())
	}
	if performer.Deleted {
		return errors.New("Merge source performer is deleted: " + sourceID.String())
	}
	_, err = qb.SoftDelete(*performer)
	if err != nil {
		return err
	}
	if err := qb.UpdateRedirects(sourceID, targetID); err != nil {
		return err
	}
	if err := qb.UpdateScenePerformers(performer, targetID, setAliases); err != nil {
		return err
	}
	redirect := models.Redirect{SourceID: sourceID, TargetID: targetID}
	return qb.CreateRedirect(redirect)
}

func (qb *performerQueryBuilder) ApplyEdit(edit models.Edit, operation models.OperationEnum, performer *models.Performer) (*models.Performer, error) {
	data, err := edit.GetPerformerData()
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
		newPerformer := models.Performer{
			ID:        UUID,
			CreatedAt: models.SQLiteTimestamp{Timestamp: now},
		}
		if data.New.Name == nil {
			return nil, errors.New("Missing performer name")
		}

		newPerformer.CopyFromPerformerEdit(*data.New, models.PerformerEdit{})

		performer, err = qb.Create(newPerformer)
		if err != nil {
			return nil, err
		}

		if len(data.New.AddedAliases) > 0 {
			aliases := models.CreatePerformerAliases(UUID, data.New.AddedAliases)
			if err := qb.CreateAliases(aliases); err != nil {
				return nil, err
			}
		}

		if len(data.New.AddedTattoos) > 0 {
			tattoos := models.CreatePerformerBodyMods(UUID, data.New.AddedTattoos)
			if err := qb.CreateTattoos(tattoos); err != nil {
				return nil, err
			}
		}

		if len(data.New.AddedPiercings) > 0 {
			piercings := models.CreatePerformerBodyMods(UUID, data.New.AddedPiercings)
			if err := qb.CreatePiercings(piercings); err != nil {
				return nil, err
			}
		}

		if len(data.New.AddedUrls) > 0 {
			urls := models.CreatePerformerURLs(UUID, data.New.AddedUrls)
			if err := qb.CreateUrls(urls); err != nil {
				return nil, err
			}
		}

		if len(data.New.AddedImages) > 0 {
			images := models.CreatePerformerImages(UUID, data.New.AddedImages)
			if err := qb.CreateImages(images); err != nil {
				return nil, err
			}
		}

		return performer, nil
	case models.OperationEnumDestroy:
		updatedPerformer, err := qb.SoftDelete(*performer)
		if err != nil {
			return nil, err
		}
		err = qb.DeleteScenePerformers(performer.ID)

		// TODO: Delete images

		return updatedPerformer, err
	case models.OperationEnumModify:
		return qb.applyModifyEdit(performer, data)
	case models.OperationEnumMerge:
		updatedPerformer, err := qb.applyModifyEdit(performer, data)
		if err != nil {
			return nil, err
		}

		for _, v := range data.MergeSources {
			sourceUUID, _ := uuid.FromString(v)
			if err := qb.mergeInto(sourceUUID, performer.ID, data.SetMergeAliases); err != nil {
				return nil, err
			}
		}

		return updatedPerformer, nil
	default:
		return nil, errors.New("Unsupported operation: " + operation.String())
	}
}

func (qb *performerQueryBuilder) applyModifyEdit(performer *models.Performer, data *models.PerformerEditData) (*models.Performer, error) {
	if err := performer.ValidateModifyEdit(*data); err != nil {
		return nil, err
	}

	performer.CopyFromPerformerEdit(*data.New, *data.Old)
	updatedPerformer, err := qb.Update(*performer)
	if err != nil {
		return nil, err
	}

	currentAliases, err := qb.GetAliases(updatedPerformer.ID)
	if err != nil {
		return nil, err
	}
	newAliases := models.CreatePerformerAliases(updatedPerformer.ID, data.New.AddedAliases)
	oldAliases := models.CreatePerformerAliases(updatedPerformer.ID, data.New.RemovedAliases)
	if err := models.ProcessSlice(&currentAliases, &newAliases, &oldAliases); err != nil {
		return nil, err
	}
	if err := qb.UpdateAliases(updatedPerformer.ID, currentAliases); err != nil {
		return nil, err
	}

	currentTattoos, err := qb.GetTattoos(updatedPerformer.ID)
	if err != nil {
		return nil, err
	}
	newTattoos := models.CreatePerformerBodyMods(updatedPerformer.ID, data.New.AddedTattoos)
	oldTattoos := models.CreatePerformerBodyMods(updatedPerformer.ID, data.New.RemovedTattoos)

	if err := models.ProcessSlice(&currentTattoos, &newTattoos, &oldTattoos); err != nil {
		return nil, err
	}
	if err := qb.UpdateTattoos(updatedPerformer.ID, currentTattoos); err != nil {
		return nil, err
	}

	currentPiercings, err := qb.GetPiercings(updatedPerformer.ID)
	if err != nil {
		return nil, err
	}
	newPiercings := models.CreatePerformerBodyMods(updatedPerformer.ID, data.New.AddedPiercings)
	oldPiercings := models.CreatePerformerBodyMods(updatedPerformer.ID, data.New.RemovedPiercings)

	if err := models.ProcessSlice(&currentPiercings, &newPiercings, &oldPiercings); err != nil {
		return nil, err
	}
	if err := qb.UpdatePiercings(updatedPerformer.ID, currentPiercings); err != nil {
		return nil, err
	}

	urls, err := qb.GetURLs(updatedPerformer.ID)
	currentUrls := models.CreatePerformerURLs(updatedPerformer.ID, urls)
	if err != nil {
		return nil, err
	}
	newUrls := models.CreatePerformerURLs(updatedPerformer.ID, data.New.AddedUrls)
	oldUrls := models.CreatePerformerURLs(updatedPerformer.ID, data.New.RemovedUrls)

	if err := models.ProcessSlice(&currentUrls, &newUrls, &oldUrls); err != nil {
		return nil, err
	}

	if err := qb.UpdateUrls(updatedPerformer.ID, currentUrls); err != nil {
		return nil, err
	}

	currentImages, err := qb.GetImages(updatedPerformer.ID)
	if err != nil {
		return nil, err
	}
	newImages := models.CreatePerformerImages(updatedPerformer.ID, data.New.AddedImages)
	oldImages := models.CreatePerformerImages(updatedPerformer.ID, data.New.RemovedImages)

	if err := models.ProcessSlice(&currentImages, &newImages, &oldImages); err != nil {
		return nil, err
	}

	if err := qb.UpdateImages(updatedPerformer.ID, currentImages); err != nil {
		return nil, err
	}

	if data.New.Name != nil && data.SetModifyAliases {
		if err = qb.UpdateScenePerformerAlias(updatedPerformer.ID, *data.Old.Name); err != nil {
			return nil, err
		}
	}

	return updatedPerformer, err
}

func (qb *performerQueryBuilder) FindMergeIDsByPerformerIDs(ids []uuid.UUID) ([][]uuid.UUID, []error) {
	redirects := models.Redirects{}
	err := qb.dbi.FindAllJoins(performerTargetRedirectTable, ids, &redirects)

	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]uuid.UUID)
	for _, redirect := range redirects {
		m[redirect.TargetID] = append(m[redirect.TargetID], redirect.SourceID)
	}

	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}
