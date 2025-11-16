package query

import (
	"context"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/jackc/pgx/v5"

	"github.com/stashapp/stash-box/internal/queries"
)

// ApplyPagination applies pagination to a query with default values
func ApplyPagination(query sq.SelectBuilder, page, perPage int) sq.SelectBuilder {
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = 25
	}
	offset := (page - 1) * perPage
	return query.Limit(uint64(perPage)).Offset(uint64(offset))
}

// ApplySortParams applies sorting to query with optional table prefix
// If tablePrefix is empty, no prefix is added to the field name
func ApplySortParams(query sq.SelectBuilder, tablePrefix string, sort, direction fmt.Stringer, defaultField, defaultDir string) sq.SelectBuilder {
	sortField := defaultField
	sortDir := defaultDir

	if sort != nil && sort.String() != "" {
		sortField = strings.ToLower(sort.String())
	}
	if direction != nil && direction.String() != "" {
		sortDir = strings.ToUpper(direction.String())
	}

	if tablePrefix != "" {
		return query.OrderBy(fmt.Sprintf("%s.%s %s", tablePrefix, sortField, sortDir))
	}
	return query.OrderBy(fmt.Sprintf("%s %s", sortField, sortDir))
}

// ExecuteQuery executes a squirrel query and converts results using a generic converter function
func ExecuteQuery[T any, M any](ctx context.Context, query sq.SelectBuilder, db queries.DBTX, converter func(T) M) ([]M, error) {
	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []M
	for rows.Next() {
		dbEntity, err := pgx.RowToStructByPos[T](rows)
		if err != nil {
			return nil, err
		}
		results = append(results, converter(dbEntity))
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return results, nil
}

// ExecuteCount executes a count query and returns the result as an int
func ExecuteCount(ctx context.Context, query sq.SelectBuilder, db queries.DBTX) (int, error) {
	sql, args, err := query.ToSql()
	if err != nil {
		return 0, err
	}

	var count int64
	err = db.QueryRow(ctx, sql, args...).Scan(&count)
	return int(count), err
}
