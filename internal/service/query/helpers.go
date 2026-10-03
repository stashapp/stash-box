package query

import (
	"context"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/stashapp/stash-box/internal/queries"
)

// DefaultPerPage is applied when a paginated query's per-page value is unset.
const DefaultPerPage = 25

// MaxPerPage is the maximum number of results a paginated query returns per page.
const MaxPerPage = 100

// PageParams holds the normalized limit and offset for a paginated query.
type PageParams struct {
	Limit  int32
	Offset int32
}

// Pagination resolves a raw page and per-page value to normalized pagination
// parameters: the page is 1-based, the limit defaults to DefaultPerPage and is
// capped at MaxPerPage, and the offset is computed from the two.
func Pagination(page, perPage int) PageParams {
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = DefaultPerPage
	}
	if perPage > MaxPerPage {
		perPage = MaxPerPage
	}
	return PageParams{
		Limit:  int32(perPage),
		Offset: int32((page - 1) * perPage),
	}
}

// ApplyPagination applies normalized pagination to a query with default values
func ApplyPagination(query sq.SelectBuilder, page, perPage int) sq.SelectBuilder {
	p := Pagination(page, perPage)
	return query.Limit(uint64(p.Limit)).Offset(uint64(p.Offset))
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
// If queryName is provided, it prepends a sqlc-style comment for better span naming in traces
func ExecuteQuery[T any, M any](ctx context.Context, query sq.SelectBuilder, db queries.DBTX, converter func(T) M, queryName string) ([]M, error) {
	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	// Prepend query name comment for tracing if provided
	if queryName != "" {
		sql = fmt.Sprintf("-- name: %s\n%s", queryName, sql)
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
// If queryName is provided, it prepends a sqlc-style comment for better span naming in traces
func ExecuteCount(ctx context.Context, query sq.SelectBuilder, db queries.DBTX, queryName string) (int, error) {
	sql, args, err := query.ToSql()
	if err != nil {
		return 0, err
	}

	// Prepend query name comment for tracing if provided
	if queryName != "" {
		sql = fmt.Sprintf("-- name: %s\n%s", queryName, sql)
	}

	var count int64
	err = db.QueryRow(ctx, sql, args...).Scan(&count)
	return int(count), err
}

// ExecuteIDQuery executes a squirrel query projecting a single UUID column and
// returns the ids in row order.
// If queryName is provided, it prepends a sqlc-style comment for better span naming in traces
func ExecuteIDQuery(ctx context.Context, query sq.SelectBuilder, db queries.DBTX, queryName string) ([]uuid.UUID, error) {
	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	// Prepend query name comment for tracing if provided
	if queryName != "" {
		sql = fmt.Sprintf("-- name: %s\n%s", queryName, sql)
	}

	rows, err := db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return ids, nil
}
