package models

import (
	"database/sql"
	"fmt"
	"math/rand"
	"reflect"
	"strconv"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/database"
)

var randomSortFloat = rand.Float64()

func handleStringCriterion(column string, value *StringCriterionInput, query *database.QueryBuilder) {
	if value != nil {
		if modifier := value.Modifier.String(); value.Modifier.IsValid() {
			switch modifier {
			case "EQUALS":
				clause, thisArgs := getSearchBinding([]string{column}, value.Value, false, false)
				query.AddWhere(clause)
				query.AddArg(thisArgs...)
			case "NOT_EQUALS":
				clause, thisArgs := getSearchBinding([]string{column}, value.Value, true, false)
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

func getColumn(tableName string, columnName string) string {
	return tableName + "." + columnName
}

func buildCountQuery(query string) string {
	return "SELECT COUNT(*) as count FROM (" + query + ") as temp"
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
	if perPage > 10000 {
		perPage = 10000
	} else if perPage < 1 {
		perPage = 1
	}

	page = (page - 1) * perPage
	return " LIMIT " + strconv.Itoa(perPage) + " OFFSET " + strconv.Itoa(page) + " "
}

func getSort(sort string, direction string, tableName string, secondarySort *string) string {
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
		} else if secondarySort != nil {
			additional = ", " + getColumn(tableName, *secondarySort) + " " + direction
		}

		return " ORDER BY " + colName + " " + direction + database.GetDialect().NullsLast() + additional
	}
}

func getSearchBinding(columns []string, q string, not bool, caseInsensitive bool) (string, []interface{}) {
	var likeClauses []string
	var args []interface{}

	notStr := ""
	binaryType := " OR "
	if not {
		notStr = " NOT "
		binaryType = " AND "
	}

	like := " LIKE ?"
	if caseInsensitive {
		like = " ILIKE ?"
	}

	queryWords := strings.Split(q, " ")
	trimmedQuery := strings.Trim(q, "\"")
	if trimmedQuery == q {
		// Search for any word
		for _, word := range queryWords {
			for _, column := range columns {
				likeClauses = append(likeClauses, column+notStr+like)
				args = append(args, "%"+word+"%")
			}
		}
	} else {
		// Search the exact query
		for _, column := range columns {
			likeClauses = append(likeClauses, column+notStr+like)
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
