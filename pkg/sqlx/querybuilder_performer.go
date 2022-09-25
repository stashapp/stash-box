package sqlx

import (
	"fmt"
	"strconv"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/edit"
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

func (qb *performerQueryBuilder) FindWithRedirect(id uuid.UUID) (*models.Performer, error) {
	query := `
		SELECT P.* FROM performers P
		WHERE P.id = $1 AND P.deleted = FALSE
		UNION
		SELECT T.* FROM performer_redirects R
		JOIN performers T ON T.id = R.target_id
		WHERE R.source_id = $1 AND T.deleted = FALSE
	`
	args := []interface{}{id}
	performers, err := qb.queryPerformers(query, args)
	if len(performers) > 0 {
		return performers[0], err
	}
	return nil, err
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
		LEFT JOIN scene_performers as scenes_join on scenes_join.performer_id = performers.id
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

func (qb *performerQueryBuilder) buildQuery(filter models.PerformerQueryInput, userID uuid.UUID) *queryBuilder {
	query := newQueryBuilder(performerDBTable)
	query.Eq("deleted", false)

	if q := filter.Name; q != nil && *q != "" {
		searchColumns := []string{"performers.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if q := filter.Names; q != nil && *q != "" {
		searchColumns := []string{"performers.name", "performers.disambiguation"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if birthYear := filter.BirthYear; birthYear != nil {
		clauses, thisArgs := getBirthYearFilterClause(birthYear.Modifier, birthYear.Value)
		query.AddWhere(clauses...)
		query.AddArg(thisArgs...)
	}

	if age := filter.Age; age != nil {
		clauses, thisArgs := getAgeFilterClause(age.Modifier, age.Value)
		query.AddWhere(clauses...)
		query.AddArg(thisArgs...)
	}

	if q := filter.Gender; q != nil && *q != "" {
		if *q == models.GenderFilterEnumUnknown {
			query.AddWhere("performers.gender IS NULL")
		} else {
			query.Eq("performers.gender", q.String())
		}
	}

	if q := filter.Ethnicity; q != nil && *q != "" {
		if *q == models.EthnicityFilterEnumUnknown {
			query.AddWhere("performers.ethnicity IS NULL")
		} else {
			query.Eq("performers.ethnicity", q.String())
		}
	}

	if q := filter.URL; q != nil && *q != "" {
		query.AddJoin(performerURLTable.table, performerURLTable.Name()+"."+performerJoinKey+" = performers.id", true)
		searchColumns := []string{performerURLTable.Name() + ".url"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	if filter.IsFavorite != nil {
		// userID is internal based on user context so it is safe to append rather than bind
		q := fmt.Sprintf(" JOIN performer_favorites F ON performers.id = F.performer_id AND F.user_id = '%s'", userID)
		if *filter.IsFavorite {
			query.Body += q
		} else {
			query.Body += " LEFT" + q
			query.AddWhere("F.performer_id IS NULL")
		}
	}

	handleStringCriterion("disambiguation", filter.Disambiguation, query)
	handleStringCriterion("country", filter.Country, query)
	/*
		handleStringCriterion("eye_color", performerFilter.EyeColor, &query)
		handleStringCriterion("height", performerFilter.Height, &query)
		handleStringCriterion("measurements", performerFilter.Measurements, &query)
		handleStringCriterion("breast_type", performerFilter.BreastType, &query)
		handleStringCriterion("career_length", performerFilter.CareerLength, &query)
		handleStringCriterion("tattoos", performerFilter.Tattoos, &query)
		handleStringCriterion("piercings", performerFilter.Piercings, &query)
		handleStringCriterion("aliases", performerFilter.Aliases, &query)
	*/

	switch {
	case filter.Sort == models.PerformerSortEnumDebut:
		query.Body += `
			JOIN (SELECT performer_id, MIN(date) as debut FROM scene_performers JOIN scenes ON scene_id = id GROUP BY performer_id) D
			ON performers.id = D.performer_id
		`
		direction := filter.Direction.String() + nullsLast()
		query.Sort = " ORDER BY debut " + direction + ", name " + direction
	case filter.Sort == models.PerformerSortEnumSceneCount:
		query.Body += `
			JOIN (SELECT performer_id, COUNT(*) as scene_count FROM scene_performers GROUP BY performer_id) D
			ON performers.id = D.performer_id
		`
		direction := filter.Direction.String() + nullsLast()
		query.Sort = " ORDER BY scene_count " + direction + ", name " + direction
	default:
		query.Sort = qb.getPerformerSort(filter)
	}

	return query
}

func (qb *performerQueryBuilder) QueryPerformers(filter models.PerformerQueryInput, userID uuid.UUID) ([]*models.Performer, error) {
	query := qb.buildQuery(filter, userID)
	query.Pagination = getPagination(filter.Page, filter.PerPage)

	var performers models.Performers
	err := qb.dbi.QueryOnly(*query, &performers)
	return performers, err
}

func (qb *performerQueryBuilder) QueryCount(filter models.PerformerQueryInput, userID uuid.UUID) (int, error) {
	query := qb.buildQuery(filter, userID)
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

func (qb *performerQueryBuilder) getPerformerSort(filter models.PerformerQueryInput) string {
	secondary := "name"
	if filter.Sort == models.PerformerSortEnumName {
		secondary = "id"
	}
	return getSort(filter.Sort.String(), filter.Direction.String(), "performers", &secondary)
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
			URL:    u.URL,
			SiteID: u.SiteID,
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
			URL:    join.URL,
			SiteID: join.SiteID,
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
		SELECT P.* FROM (
			SELECT id, SUM(similarity) AS score FROM (
				SELECT P.id, similarity(P.name, $1) AS similarity
				FROM performers P
				WHERE P.deleted = FALSE AND P.name % $1 AND similarity(P.name, $1) > 0.5
			UNION
				SELECT P.id, (similarity(COALESCE(PA.alias, ''), $1) * 0.7) AS similarity
				FROM performers P
				LEFT JOIN performer_aliases PA on PA.performer_id = P.id
				WHERE P.deleted = FALSE AND PA.alias % $1 AND similarity(COALESCE(PA.alias, ''), $1) > 0.6
			UNION
				SELECT P.id, (similarity(COALESCE(P.disambiguation, ''), $1) * 0.3) AS similarity
				FROM performers P
				WHERE P.deleted = FALSE AND P.disambiguation % $1 AND similarity(COALESCE(P.disambiguation), $1) > 0.7
			) A
			GROUP BY id
			ORDER BY score DESC
			LIMIT $2
		) T
		JOIN performers P ON P.id = T.id
		ORDER BY score DESC;
	`
	args := []interface{}{term, limit}
	return qb.queryPerformers(query, args)
}

func (qb *performerQueryBuilder) DeleteScenePerformers(id uuid.UUID) error {
	// Delete scene_performers joins
	return qb.dbi.DeleteJoins(performerSceneTable, id)
}

func (qb *performerQueryBuilder) DeletePerformerFavorites(id uuid.UUID) error {
	// Delete performer_favorites joins
	return qb.dbi.DeleteJoins(performerFavoriteTable, id)
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

func (qb *performerQueryBuilder) UpdateScenePerformers(oldPerformer *models.Performer, newTarget *models.Performer, setAliases bool) error {
	// Set old name as scene performance alias where one isn't already set
	if setAliases {
		if err := qb.UpdateScenePerformerAlias(oldPerformer.ID, oldPerformer.Name, newTarget.Name); err != nil {
			return err
		}
	}

	// Reassign scene performances to new id where it isn't already assigned
	query := `UPDATE scene_performers
					 SET performer_id = ?
					 WHERE performer_id = ?
					 AND scene_id NOT IN (SELECT scene_id from scene_performers WHERE performer_id = ?)`
	args := []interface{}{newTarget.ID, oldPerformer.ID, newTarget.ID}
	err := qb.dbi.RawQuery(scenePerformerTable.table, query, args, nil)
	if err != nil {
		return err
	}

	// Delete any remaining joins with the old performer
	query = `DELETE FROM scene_performers WHERE performer_id = ?`
	args = []interface{}{oldPerformer.ID}
	return qb.dbi.RawQuery(scenePerformerTable.table, query, args, nil)
}

func (qb *performerQueryBuilder) reassignFavorites(oldPerformer *models.Performer, newTargetID uuid.UUID) error {
	// Reassign performer favorites to new id where it isn't already assigned
	query := `UPDATE performer_favorites
					 SET performer_id = ?
					 WHERE performer_id = ?
					 AND user_id NOT IN (SELECT user_id from performer_favorites WHERE performer_id = ?)`
	args := []interface{}{newTargetID, oldPerformer.ID, newTargetID}
	err := qb.dbi.RawQuery(performerFavoriteTable.table, query, args, nil)
	if err != nil {
		return err
	}

	// Delete any remaining joins with the old performer
	query = `DELETE FROM performer_favorites WHERE performer_id = ?`
	args = []interface{}{oldPerformer.ID}
	return qb.dbi.RawQuery(performerFavoriteTable.table, query, args, nil)
}

func (qb *performerQueryBuilder) UpdateScenePerformerAlias(performerID uuid.UUID, oldName string, newName string) error {
	query := `UPDATE scene_performers
            SET "as" = ?
            WHERE performer_id = ?
            AND "as" IS NULL`
	args := []interface{}{oldName, performerID}
	err := qb.dbi.RawQuery(scenePerformerTable.table, query, args, nil)
	if err != nil {
		return err
	}

	query = `UPDATE scene_performers
            SET "as" = NULL
            WHERE performer_id = ?
            AND "as" = ?`
	args = []interface{}{performerID, newName}
	return qb.dbi.RawQuery(scenePerformerTable.table, query, args, nil)
}

func (qb *performerQueryBuilder) MergeInto(source *models.Performer, target *models.Performer, setAliases bool) error {
	if source.Deleted {
		return fmt.Errorf("merge source performer is deleted: %s", source.ID.String())
	}
	if target.Deleted {
		return fmt.Errorf("merge target performer is deleted: %s", target.ID.String())
	}

	if _, err := qb.SoftDelete(*source); err != nil {
		return err
	}

	if err := qb.UpdateRedirects(source.ID, target.ID); err != nil {
		return err
	}
	if err := qb.UpdateScenePerformers(source, target, setAliases); err != nil {
		return err
	}
	if err := qb.reassignFavorites(source, target.ID); err != nil {
		return err
	}
	redirect := models.Redirect{SourceID: source.ID, TargetID: target.ID}
	return qb.CreateRedirect(redirect)
}

func (qb *performerQueryBuilder) ApplyEdit(performer *models.Performer, create bool, data *models.PerformerEditData) (*models.Performer, error) {
	old := data.Old
	if old == nil {
		old = &models.PerformerEdit{}
	}
	performer.CopyFromPerformerEdit(*data.New, *old)

	var updatedPerformer *models.Performer
	var err error
	if create {
		updatedPerformer, err = qb.Create(*performer)
	} else {
		updatedPerformer, err = qb.Update(*performer)
	}
	if err != nil {
		return nil, err
	}

	if err := qb.updateAliasesFromEdit(updatedPerformer, data); err != nil {
		return nil, err
	}

	if err := qb.updateTattoosFromEdit(updatedPerformer, data); err != nil {
		return nil, err
	}

	if err := qb.updatePiercingsFromEdit(updatedPerformer, data); err != nil {
		return nil, err
	}

	if err := qb.updateURLsFromEdit(updatedPerformer, data); err != nil {
		return nil, err
	}

	if err := qb.updateImagesFromEdit(updatedPerformer, data); err != nil {
		return nil, err
	}

	if data.New.Name != nil && data.SetModifyAliases {
		if err = qb.UpdateScenePerformerAlias(updatedPerformer.ID, *data.Old.Name, *data.New.Name); err != nil {
			return nil, err
		}
	}

	return updatedPerformer, err
}

func (qb *performerQueryBuilder) GetEditAliases(id *uuid.UUID, data *models.PerformerEdit) ([]string, error) {
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

func (qb *performerQueryBuilder) updateAliasesFromEdit(performer *models.Performer, data *models.PerformerEditData) error {
	aliases, err := qb.GetEditAliases(&performer.ID, data.New)
	if err != nil {
		return err
	}

	newAliases := models.CreatePerformerAliases(performer.ID, aliases)
	return qb.UpdateAliases(performer.ID, newAliases)
}

func (qb *performerQueryBuilder) GetEditTattoos(id *uuid.UUID, data *models.PerformerEdit) ([]*models.BodyModification, error) {
	var tattoos models.PerformerBodyMods
	if id != nil {
		currentTattoos, err := qb.GetTattoos(*id)
		if err != nil {
			return nil, err
		}
		tattoos = currentTattoos
	}

	return edit.MergeBodyMods(tattoos, data.AddedTattoos, data.RemovedTattoos), nil
}

func (qb *performerQueryBuilder) updateTattoosFromEdit(performer *models.Performer, data *models.PerformerEditData) error {
	tattoos, err := qb.GetEditTattoos(&performer.ID, data.New)
	if err != nil {
		return err
	}

	newTattoos := models.CreatePerformerBodyMods(performer.ID, tattoos)
	return qb.UpdateTattoos(performer.ID, newTattoos)
}

func (qb *performerQueryBuilder) GetEditPiercings(id *uuid.UUID, data *models.PerformerEdit) ([]*models.BodyModification, error) {
	var piercings models.PerformerBodyMods
	if id != nil {
		currentPiercings, err := qb.GetPiercings(*id)
		if err != nil {
			return nil, err
		}
		piercings = currentPiercings
	}

	return edit.MergeBodyMods(piercings, data.AddedPiercings, data.RemovedPiercings), nil
}

func (qb *performerQueryBuilder) updatePiercingsFromEdit(performer *models.Performer, data *models.PerformerEditData) error {
	piercings, err := qb.GetEditPiercings(&performer.ID, data.New)
	if err != nil {
		return err
	}

	newPiercings := models.CreatePerformerBodyMods(performer.ID, piercings)
	return qb.UpdatePiercings(performer.ID, newPiercings)
}

func (qb *performerQueryBuilder) GetEditURLs(id *uuid.UUID, data *models.PerformerEdit) ([]*models.URL, error) {
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

func (qb *performerQueryBuilder) updateURLsFromEdit(performer *models.Performer, data *models.PerformerEditData) error {
	urls, err := qb.GetEditURLs(&performer.ID, data.New)
	if err != nil {
		return err
	}

	newURLs := models.CreatePerformerURLs(performer.ID, urls)
	return qb.UpdateUrls(performer.ID, newURLs)
}

func (qb *performerQueryBuilder) GetEditImages(id *uuid.UUID, data *models.PerformerEdit) ([]uuid.UUID, error) {
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

func (qb *performerQueryBuilder) updateImagesFromEdit(performer *models.Performer, data *models.PerformerEditData) error {
	ids, err := qb.GetEditImages(&performer.ID, data.New)
	if err != nil {
		return err
	}

	images := models.CreatePerformerImages(performer.ID, ids)
	return qb.UpdateImages(performer.ID, images)
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
