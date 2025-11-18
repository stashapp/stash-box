package user

import (
	"context"

	sq "github.com/Masterminds/squirrel"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
)

func (s *User) Query(ctx context.Context, input models.UserQueryInput) (*models.QueryUsersResultType, error) {
	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query := psql.Select("*").From("users")

	// Apply name filter - search across name and email columns
	if input.Name != nil && *input.Name != "" {
		searchTerm := "%" + *input.Name + "%"
		query = query.Where(
			sq.Or{
				sq.ILike{"users.name": searchTerm},
				sq.ILike{"users.email": searchTerm},
			},
		)
	}

	// Get count
	countQuery := psql.Select("COUNT(*)").FromSelect(query, "subquery")
	count, err := queryhelper.ExecuteCount(ctx, countQuery, s.queries.DB(), "QueryUsersCount")
	if err != nil {
		return nil, err
	}

	// Apply sort
	query = query.OrderBy("name ASC")

	// Apply pagination
	query = queryhelper.ApplyPagination(query, input.Page, input.PerPage)

	// Execute query
	users, err := queryhelper.ExecuteQuery(ctx, query, s.queries.DB(), converter.UserToModel, "QueryUsers")
	if err != nil {
		return nil, err
	}

	return &models.QueryUsersResultType{
		Count: count,
		Users: users,
	}, nil
}
