package tag

import (
	"context"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
)

func (s *Tag) Query(ctx context.Context, input models.TagQueryInput) (*models.QueryTagsResultType, error) {
	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query := psql.Select("tags.*").From("tags").Where(sq.Eq{"deleted": false})

	// Filter by name only
	if input.Name != nil && *input.Name != "" {
		searchTerm := "%" + *input.Name + "%"
		query = query.Where(sq.ILike{"tags.name": searchTerm})
	}

	// Filter by names (searches name and aliases)
	if input.Names != nil && *input.Names != "" {
		searchTerm := "%" + *input.Names + "%"
		existsClause := fmt.Sprintf(
			"EXISTS (SELECT T.id FROM tags T LEFT JOIN tag_aliases TA ON T.id = TA.tag_id WHERE tags.id = T.id AND (LOWER(T.name) LIKE %s OR LOWER(TA.alias) LIKE %s) GROUP BY T.id)",
			sq.Placeholders(1), sq.Placeholders(1),
		)
		query = query.Where(sq.Expr(existsClause, strings.ToLower(searchTerm), strings.ToLower(searchTerm)))
	}

	// Filter by category ID
	if input.CategoryID != nil {
		query = query.Where(sq.Eq{"tags.category_id": input.CategoryID})
	}

	// Get count
	countQuery := psql.Select("COUNT(*)").FromSelect(query, "subquery")
	count, err := queryhelper.ExecuteCount(ctx, countQuery, s.queries.DB())
	if err != nil {
		return nil, err
	}

	// Apply sort
	query = queryhelper.ApplySortParams(query, "", input.Sort, input.Direction, "name", "ASC")

	// Apply pagination
	query = queryhelper.ApplyPagination(query, input.Page, input.PerPage)

	// Execute query
	tags, err := queryhelper.ExecuteQuery(ctx, query, s.queries.DB(), converter.TagToModel)
	if err != nil {
		return nil, err
	}

	return &models.QueryTagsResultType{
		Count: count,
		Tags:  tags,
	}, nil
}
