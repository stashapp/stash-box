package models

import (
	"database/sql"
	"errors"
	"fmt"
	"math/rand"
	"reflect"
	"strconv"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/logger"
)

var randomSortFloat = rand.Float64()

func handleStringCriterion(column string, value *StringCriterionInput, query *database.QueryBuilder) {
	if value != nil {
		if modifier := value.Modifier.String(); value.Modifier.IsValid() {
			switch modifier {
			case "EQUALS":
				clause, thisArgs := getSearchBinding([]string{column}, value.Value, false)
				query.AddWhere(clause)
				query.AddArg(thisArgs...)
			case "NOT_EQUALS":
				clause, thisArgs := getSearchBinding([]string{column}, value.Value, true)
				query.AddWhere(clause)
				query.AddArg(thisArgs...)
			case "IS_NULL":
				query.AddWhere(column + " IS NULL")
			case "NOT_NULL":
				query.AddWhere(column + " IS NOT NULL")
			}
		}
	}
}

func insertObject(tx *sqlx.Tx, table string, object interface{}, ignoreConflicts bool) error {
	ensureTx(tx)
	fields, values := SQLGenKeysCreate(object)

    conflictHandling :=  ""
    if ignoreConflicts {
        conflictHandling = "ON CONFLICT DO NOTHING"
    }

	_, err := tx.NamedExec(
		`INSERT INTO `+table+` (`+fields+`)
				VALUES (`+values+`)
                `+conflictHandling+`
		`,
		object,
	)

	return err
}

func insertObjects(tx *sqlx.Tx, table string, objects interface{}) error {
	// ensure objects is an array
	if reflect.TypeOf(objects).Kind() != reflect.Slice {
		return errors.New("Non-slice passed to insertObjects")
	}

	slice := reflect.ValueOf(objects)
	for i := 0; i < slice.Len(); i++ {
		err := insertObject(tx, table, slice.Index(i).Interface(), false)

		if err != nil {
			return err
		}
	}

	return nil
}

func updateObjectByID(tx *sqlx.Tx, table string, object interface{}) error {
	ensureTx(tx)
	_, err := tx.NamedExec(
		`UPDATE `+table+` SET `+SQLGenKeys(object)+` WHERE `+table+`.id = :id`,
		object,
	)

	return err
}

func deleteObjectsByColumn(tx *sqlx.Tx, table string, column string, value interface{}) error {
	ensureTx(tx)
	query := tx.Rebind(`DELETE FROM ` + table + ` WHERE ` + column + ` = ?`)
	_, err := tx.Exec(query, value)
	return err
}

func getByID(tx *sqlx.Tx, table string, id uuid.UUID, object interface{}) error {
	query := tx.Rebind(`SELECT * FROM ` + table + ` WHERE id = ? LIMIT 1`)
	return tx.Get(object, query, id)
}

func selectAll(tableName string) string {
	idColumn := getColumn(tableName, "*")
	return "SELECT " + idColumn + " FROM " + tableName + " "
}

func selectDistinctIDs(tableName string) string {
	idColumn := getColumn(tableName, "id")
	return "SELECT DISTINCT " + idColumn + " FROM " + tableName + " "
}

func buildCountQuery(query string) string {
	return "SELECT COUNT(*) as count FROM (" + query + ") as temp"
}

func getColumn(tableName string, columnName string) string {
	return tableName + "." + columnName
}

func getPagination(findFilter *QuerySpec) string {
	if findFilter == nil {
		panic("nil find filter for pagination")
	}

	var page int
	if findFilter.Page == nil || *findFilter.Page < 1 {
		page = 1
	} else {
		page = *findFilter.Page
	}

	var perPage int
	if findFilter.PerPage == nil {
		perPage = 25
	} else {
		perPage = *findFilter.PerPage
	}
	if perPage > 1000 {
		perPage = 1000
	} else if perPage < 1 {
		perPage = 1
	}

	page = (page - 1) * perPage
	return " LIMIT " + strconv.Itoa(perPage) + " OFFSET " + strconv.Itoa(page) + " "
}

func getSort(sort string, direction string, tableName string) string {
	if direction != "ASC" && direction != "DESC" {
		direction = "ASC"
	}

	if strings.Contains(sort, "_count") {
		var relationTableName = strings.Split(sort, "_")[0] // TODO: pluralize?
		colName := getColumn(relationTableName, "id")
		return " ORDER BY COUNT(distinct " + colName + ") " + direction
	} else if strings.Compare(sort, "filesize") == 0 {
		colName := getColumn(tableName, "size")
		return " ORDER BY cast(" + colName + " as integer) " + direction
	} else if strings.Compare(sort, "random") == 0 {
		// https://stackoverflow.com/a/24511461
		// TODO seed as a parameter from the UI
		colName := getColumn(tableName, "id")
		randomSortString := strconv.FormatFloat(randomSortFloat, 'f', 16, 32)
		return " ORDER BY " + "(substr(" + colName + " * " + randomSortString + ", length(" + colName + ") + 2))" + " " + direction
	} else {
		colName := getColumn(tableName, sort)
		var additional string
		if tableName == "scene_markers" {
			additional = ", scene_markers.scene_id ASC, scene_markers.seconds ASC"
		}

		return " ORDER BY " + colName + " " + direction + database.GetDialect().NullsLast() + additional
	}
}

func getSearch(columns []string, q string) string {
	var likeClauses []string
	queryWords := strings.Split(q, " ")
	trimmedQuery := strings.Trim(q, "\"")
	if trimmedQuery == q {
		// Search for any word
		for _, word := range queryWords {
			for _, column := range columns {
				likeClauses = append(likeClauses, column+" LIKE '%"+word+"%'")
			}
		}
	} else {
		// Search the exact query
		for _, column := range columns {
			likeClauses = append(likeClauses, column+" LIKE '%"+trimmedQuery+"%'")
		}
	}
	likes := strings.Join(likeClauses, " OR ")

	return "(" + likes + ")"
}

func getSearchBinding(columns []string, q string, not bool) (string, []interface{}) {
	var likeClauses []string
	var args []interface{}

	notStr := ""
	binaryType := " OR "
	if not {
		notStr = " NOT "
		binaryType = " AND "
	}

	queryWords := strings.Split(q, " ")
	trimmedQuery := strings.Trim(q, "\"")
	if trimmedQuery == q {
		// Search for any word
		for _, word := range queryWords {
			for _, column := range columns {
				likeClauses = append(likeClauses, column+notStr+" LIKE ?")
				args = append(args, "%"+word+"%")
			}
		}
	} else {
		// Search the exact query
		for _, column := range columns {
			likeClauses = append(likeClauses, column+notStr+" LIKE ?")
			args = append(args, "%"+trimmedQuery+"%")
		}
	}
	likes := strings.Join(likeClauses, binaryType)

	return "(" + likes + ")", args
}

func getInBinding(length int) string {
	bindings := strings.Repeat("?, ", length)
	bindings = strings.TrimRight(bindings, ", ")
	return "(" + bindings + ")"
}

func runIdsQuery(query string, args []interface{}) ([]uuid.UUID, error) {
	var result []struct {
		ID uuid.UUID `db:"id"`
	}
	query = database.DB.Rebind(query)
	if err := database.DB.Select(&result, query, args...); err != nil && err != sql.ErrNoRows {
		return []uuid.UUID{}, err
	}

	vsm := make([]uuid.UUID, len(result))
	for i, v := range result {
		vsm[i] = v.ID
	}
	return vsm, nil
}

func runCountQuery(query string, args []interface{}) (int, error) {
	// Perform query and fetch result
	result := struct {
		Count int `db:"count"`
	}{0}

	query = database.DB.Rebind(query)
	if err := database.DB.Get(&result, query, args...); err != nil && err != sql.ErrNoRows {
		return 0, err
	}

	return result.Count, nil
}

func executeFindQuery(tableName string, body string, args []interface{}, sortAndPagination string, whereClauses []string, havingClauses []string) ([]uuid.UUID, int) {
	if len(whereClauses) > 0 {
		body = body + " WHERE " + strings.Join(whereClauses, " AND ") // TODO handle AND or OR
	}
	body = body + " GROUP BY " + tableName + ".id "
	if len(havingClauses) > 0 {
		body = body + " HAVING " + strings.Join(havingClauses, " AND ") // TODO handle AND or OR
	}

	countQuery := buildCountQuery(body)
	countResult, countErr := runCountQuery(countQuery, args)

	idsQuery := body + sortAndPagination
	idsResult, idsErr := runIdsQuery(idsQuery, args)

	if countErr != nil {
		logger.Errorf("Error executing count query with SQL: %s, args: %v, error: %s", countQuery, args, countErr.Error())
		panic(countErr)
	}
	if idsErr != nil {
		logger.Errorf("Error executing find query with SQL: %s, args: %v, error: %s", idsQuery, args, idsErr.Error())
		panic(idsErr)
	}

	return idsResult, countResult
}

func executeDeleteQuery(tableName string, id uuid.UUID, tx *sqlx.Tx) error {
	if tx == nil {
		panic("must use a transaction")
	}
	idColumnName := getColumn(tableName, "id")
	query := tx.Rebind(`DELETE FROM ` + tableName + ` WHERE ` + idColumnName + ` = ?`)
	_, err := tx.Exec(query, id)
	return err
}

func ensureTx(tx *sqlx.Tx) {
	if tx == nil {
		panic("must use a transaction")
	}
}

// https://github.com/jmoiron/sqlx/issues/410
// sqlGenKeys is used for passing a struct and returning a string
// of keys for non empty key:values. These keys are formated
// keyname=:keyname with a comma seperating them
func SQLGenKeys(i interface{}) string {
	return sqlGenKeys(i, false)
}

// support a partial interface. When a partial interface is provided,
// keys will always be included if the value is not null. The partial
// interface must therefore consist of pointers
func SQLGenKeysPartial(i interface{}) string {
	return sqlGenKeys(i, true)
}

func sqlGenKeys(i interface{}, partial bool) string {
	var query []string
	v := reflect.ValueOf(i)
	for i := 0; i < v.NumField(); i++ {
		//get key for struct tag
		rawKey := v.Type().Field(i).Tag.Get("db")
		key := strings.Split(rawKey, ",")[0]
		if key == "id" {
			continue
		}
		switch t := v.Field(i).Interface().(type) {
		case string:
			if partial || t != "" {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		case int, int64, float64:
			if partial || t != 0 {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		case SQLiteTimestamp:
			if partial || !t.Timestamp.IsZero() {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		case SQLiteDate:
			if partial || t.Valid {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		case sql.NullString:
			if partial || t.Valid {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		case sql.NullBool:
			if partial || t.Valid {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		case sql.NullInt64:
			if partial || t.Valid {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		case sql.NullFloat64:
			if partial || t.Valid {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		case uuid.NullUUID:
			if partial || t.Valid {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		case uuid.UUID:
			if partial || t != uuid.Nil {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		default:
			reflectValue := reflect.ValueOf(t)
			isNil := reflectValue.IsNil()
			if !isNil {
				query = append(query, fmt.Sprintf("%s=:%s", key, key))
			}
		}
	}
	return strings.Join(query, ", ")
}

func SQLGenKeysCreate(i interface{}) (string, string) {
	var fields []string
	var values []string

	v := reflect.ValueOf(i)
	for i := 0; i < v.NumField(); i++ {
		//get key for struct tag
		rawKey := v.Type().Field(i).Tag.Get("db")
		key := strings.Split(rawKey, ",")[0]
		switch t := v.Field(i).Interface().(type) {
		case string:
			if t != "" {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		case int, int64, float64:
			if t != 0 {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		case SQLiteTimestamp:
			if !t.Timestamp.IsZero() {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		case SQLiteDate:
			if t.Valid {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		case sql.NullString:
			if t.Valid {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		case sql.NullBool:
			if t.Valid {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		case sql.NullInt64:
			if t.Valid {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		case sql.NullFloat64:
			if t.Valid {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		case uuid.NullUUID:
			if t.Valid {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		case uuid.UUID:
			if t != uuid.Nil {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		default:
			reflectValue := reflect.ValueOf(t)
			isNil := reflectValue.IsNil()
			if !isNil {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		}
	}
	return strings.Join(fields, ", "), strings.Join(values, ", ")
}
