package sqlx

import (
	"database/sql"
	"math/rand"
	"strconv"
	"strings"

	"github.com/pkg/errors"
	"github.com/stashapp/stash-box/pkg/models"
)

var randomSortFloat = rand.Float64()

func handleStringCriterion(column string, value *models.StringCriterionInput, query *queryBuilder) {
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

func buildCountQuery(query string) string {
	return "SELECT COUNT(*) as count FROM (" + query + ") as temp"
}

func getPagination(findFilter *models.QuerySpec) string {
	filter := findFilter
	if filter == nil {
		filter = &models.QuerySpec{}
	}

	var page int
	if filter.Page == nil || *filter.Page < 1 {
		page = 1
	} else {
		page = *filter.Page
	}

	var perPage int
	if filter.PerPage == nil {
		perPage = 25
	} else {
		perPage = *filter.PerPage
	}
	if perPage > 10000 {
		perPage = 10000
	} else if perPage < 1 {
		perPage = 1
	}

	page = (page - 1) * perPage
	return " LIMIT " + strconv.Itoa(perPage) + " OFFSET " + strconv.Itoa(page) + " "
}

func getSort(dialect Dialect, sort string, direction string, tableName string, secondarySort *string) string {
	if direction != "ASC" && direction != "DESC" {
		direction = "ASC"
	}

	switch {
	case strings.Contains(sort, "_count"):
		var relationTableName = strings.Split(sort, "_")[0] // TODO: pluralize?
		colName := getColumn(relationTableName, "id")
		return " ORDER BY COUNT(distinct " + colName + ") " + direction
	case strings.Compare(sort, "filesize") == 0:
		colName := getColumn(tableName, "size")
		return " ORDER BY cast(" + colName + " as integer) " + direction
	case strings.Compare(sort, "random") == 0:
		// https://stackoverflow.com/a/24511461
		// TODO seed as a parameter from the UI
		colName := getColumn(tableName, "id")
		randomSortString := strconv.FormatFloat(randomSortFloat, 'f', 16, 32)
		return " ORDER BY " + "(substr(" + colName + " * " + randomSortString + ", length(" + colName + ") + 2))" + " " + direction
	default:
		colName := getColumn(tableName, sort)
		var additional string
		if tableName == "scene_markers" {
			additional = ", scene_markers.scene_id ASC, scene_markers.seconds ASC"
		} else if secondarySort != nil {
			additional = ", " + getColumn(tableName, *secondarySort) + " " + direction
		}

		return " ORDER BY " + colName + " " + direction + dialect.NullsLast() + additional
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

func runCountQuery(db db, query string, args []interface{}) (int, error) {
	// Perform query and fetch result
	result := struct {
		Count int `db:"count"`
	}{0}

	query = db.Rebind(query)
	if err := db.Get(&result, query, args...); err != nil && !errors.Is(err, sql.ErrNoRows) {
		return 0, err
	}

	return result.Count, nil
}
