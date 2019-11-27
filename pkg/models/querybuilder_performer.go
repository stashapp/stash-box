package models

import (
	"strconv"
	"time"

	"github.com/stashapp/stashdb/pkg/database"

	"github.com/jmoiron/sqlx"
)

type PerformerQueryBuilder struct {
	dbi database.DBI
}

func NewPerformerQueryBuilder(tx *sqlx.Tx) PerformerQueryBuilder {
	return PerformerQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *PerformerQueryBuilder) toModel(ro interface{}) *Performer {
	if ro != nil {
		return ro.(*Performer)
	}

	return nil
}

func (qb *PerformerQueryBuilder) Create(newPerformer Performer) (*Performer, error) {
	ret, err := qb.dbi.Insert(newPerformer)
	return qb.toModel(ret), err
}

func (qb *PerformerQueryBuilder) Update(updatedPerformer Performer) (*Performer, error) {
	ret, err := qb.dbi.Update(updatedPerformer)
	return qb.toModel(ret), err
}

func (qb *PerformerQueryBuilder) Destroy(id int64) error {
	return qb.dbi.Delete(id, performerDBTable)
}

func (qb *PerformerQueryBuilder) CreateAliases(newJoins PerformerAliases) error {
	return qb.dbi.InsertJoins(performerAliasTable, &newJoins)
}

func (qb *PerformerQueryBuilder) UpdateAliases(performerID int64, updatedJoins PerformerAliases) error {
	return qb.dbi.ReplaceJoins(performerAliasTable, performerID, &updatedJoins)
}

func (qb *PerformerQueryBuilder) CreateUrls(newJoins PerformerUrls) error {
	return qb.dbi.InsertJoins(performerUrlTable, &newJoins)
}

func (qb *PerformerQueryBuilder) UpdateUrls(performerID int64, updatedJoins PerformerUrls) error {
	return qb.dbi.ReplaceJoins(performerUrlTable, performerID, &updatedJoins)
}

func (qb *PerformerQueryBuilder) CreateTattoos(newJoins PerformerBodyMods) error {
	return qb.dbi.InsertJoins(performerTattooTable, &newJoins)
}

func (qb *PerformerQueryBuilder) UpdateTattoos(performerID int64, updatedJoins PerformerBodyMods) error {
	return qb.dbi.ReplaceJoins(performerTattooTable, performerID, &updatedJoins)
}

func (qb *PerformerQueryBuilder) CreatePiercings(newJoins PerformerBodyMods) error {
	return qb.dbi.InsertJoins(performerPiercingTable, &newJoins)
}

func (qb *PerformerQueryBuilder) UpdatePiercings(performerID int64, updatedJoins PerformerBodyMods) error {
	return qb.dbi.ReplaceJoins(performerPiercingTable, performerID, &updatedJoins)
}

func (qb *PerformerQueryBuilder) Find(id int64) (*Performer, error) {
	ret, err := qb.dbi.Find(id, performerDBTable)
	return qb.toModel(ret), err
}

func (qb *PerformerQueryBuilder) FindBySceneID(sceneID int) (Performers, error) {
	query := `
		SELECT performers.* FROM performers
		LEFT JOIN performers_scenes as scenes_join on scenes_join.performer_id = performers.id
		LEFT JOIN scenes on scenes_join.scene_id = scenes.id
		WHERE scenes.id = ?
		GROUP BY performers.id
	`
	args := []interface{}{sceneID}
	return qb.queryPerformers(query, args)
}

func (qb *PerformerQueryBuilder) FindByNames(names []string) (Performers, error) {
	query := "SELECT * FROM performers WHERE name IN " + getInBinding(len(names))
	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryPerformers(query, args)
}

func (qb *PerformerQueryBuilder) FindByAliases(names []string) (Performers, error) {
	query := `SELECT performers.* FROM performers
		left join performer_aliases on performers.id = performer_aliases.performer_id
		WHERE performer_aliases.alias IN ` + getInBinding(len(names))

	var args []interface{}
	for _, name := range names {
		args = append(args, name)
	}
	return qb.queryPerformers(query, args)
}

func (qb *PerformerQueryBuilder) FindByName(name string) (Performers, error) {
	query := "SELECT * FROM performers WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	return qb.queryPerformers(query, args)
}

func (qb *PerformerQueryBuilder) FindByAlias(name string) (Performers, error) {
	query := `SELECT performers.* FROM performers
		left join performer_aliases on performers.id = performer_aliases.performer_id
		WHERE upper(performer_aliases.alias) = UPPER(?)`

	var args []interface{}
	args = append(args, name)
	return qb.queryPerformers(query, args)
}

func (qb *PerformerQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT performers.id FROM performers"), nil)
}

func (qb *PerformerQueryBuilder) Query(performerFilter *PerformerFilterType, findFilter *QuerySpec) ([]*Performer, int) {
	if performerFilter == nil {
		performerFilter = &PerformerFilterType{}
	}
	if findFilter == nil {
		findFilter = &QuerySpec{}
	}

	query := queryBuilder{
		tableName: "performers",
	}

	query.body = selectDistinctIDs("performers")

	if q := performerFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"performers.name"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false)
		query.addWhere(clause)
		query.addArg(thisArgs...)
	}

	if birthYear := performerFilter.BirthYear; birthYear != nil {
		clauses, thisArgs := getBirthYearFilterClause(birthYear.Modifier, birthYear.Value)
		query.addWhere(clauses...)
		query.addArg(thisArgs...)
	}

	if age := performerFilter.Age; age != nil {
		clauses, thisArgs := getAgeFilterClause(age.Modifier, age.Value)
		query.addWhere(clauses...)
		query.addArg(thisArgs...)
	}

	//handleStringCriterion("ethnicity", performerFilter.Ethnicity, &query)
	handleStringCriterion("country", performerFilter.Country, &query)
	//handleStringCriterion("eye_color", performerFilter.EyeColor, &query)
	//handleStringCriterion("height", performerFilter.Height, &query)
	//handleStringCriterion("measurements", performerFilter.Measurements, &query)
	//handleStringCriterion("fake_tits", performerFilter.FakeTits, &query)
	//handleStringCriterion("career_length", performerFilter.CareerLength, &query)
	//handleStringCriterion("tattoos", performerFilter.Tattoos, &query)
	//handleStringCriterion("piercings", performerFilter.Piercings, &query)
	//handleStringCriterion("aliases", performerFilter.Aliases, &query)

	query.sortAndPagination = qb.getPerformerSort(findFilter) + getPagination(findFilter)
	idsResult, countResult := query.executeFind()

	var performers []*Performer
	for _, id := range idsResult {
		performer, _ := qb.Find(id)
		performers = append(performers, performer)
	}

	return performers, countResult
}

func getBirthYearFilterClause(criterionModifier CriterionModifier, value int) ([]string, []interface{}) {
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

func getAgeFilterClause(criterionModifier CriterionModifier, value int) ([]string, []interface{}) {
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

func (qb *PerformerQueryBuilder) getPerformerSort(findFilter *QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(sort, direction, "performers")
}

func (qb *PerformerQueryBuilder) queryPerformers(query string, args []interface{}) (Performers, error) {
	output := Performers{}
	err := qb.dbi.RawQuery(performerDBTable, query, args, &output)
	return output, err
}

func (qb *PerformerQueryBuilder) GetAliases(id int64) ([]string, error) {
	joins := PerformerAliases{}
	err := qb.dbi.FindJoins(performerAliasTable, id, &joins)

	return joins.ToAliases(), err
}

func (qb *PerformerQueryBuilder) GetUrls(id int64) (PerformerUrls, error) {
	joins := PerformerUrls{}
	err := qb.dbi.FindJoins(performerUrlTable, id, &joins)

	return joins, err
}

func (qb *PerformerQueryBuilder) GetTattoos(id int64) (PerformerBodyMods, error) {
	joins := PerformerBodyMods{}
	err := qb.dbi.FindJoins(performerTattooTable, id, &joins)

	return joins, err
}

func (qb *PerformerQueryBuilder) GetPiercings(id int64) (PerformerBodyMods, error) {
	joins := PerformerBodyMods{}
	err := qb.dbi.FindJoins(performerPiercingTable, id, &joins)

	return joins, err
}
