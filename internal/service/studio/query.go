package studio

import (
	"context"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/converter"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	"github.com/stashapp/stash-box/pkg/models"
)

func (s *Studio) Query(ctx context.Context, input models.StudioQueryInput) (*models.QueryStudiosResultType, error) {
	user := auth.GetCurrentUser(ctx)

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

	// Build data query
	query := s.buildStudioQuery(psql, input, user.ID, false)

	// Apply sort
	query = queryhelper.ApplySortParams(query, "studios", input.Sort, input.Direction, "name", "ASC")

	// Apply pagination
	query = queryhelper.ApplyPagination(query, input.Page, input.PerPage)

	// Get count
	countQuery := s.buildStudioQuery(psql, input, user.ID, true)
	count, err := queryhelper.ExecuteCount(ctx, countQuery, s.queries.DB())
	if err != nil {
		return nil, err
	}

	// Execute query
	studios, err := queryhelper.ExecuteQuery(ctx, query, s.queries.DB(), converter.StudioToModel)
	if err != nil {
		return nil, err
	}

	return &models.QueryStudiosResultType{
		Count:   count,
		Studios: studios,
	}, nil
}

func (s *Studio) buildStudioQuery(psql sq.StatementBuilderType, input models.StudioQueryInput, userID uuid.UUID, forCount bool) sq.SelectBuilder {
	var query sq.SelectBuilder
	if forCount {
		query = psql.Select("COUNT(DISTINCT studios.id)").From("studios")
	} else {
		query = psql.Select("studios.*").From("studios")
	}

	query = query.
		LeftJoin("studios as parent_studio ON studios.parent_studio_id = parent_studio.id").
		Where(sq.Eq{"studios.deleted": false})

	// Filter by URL
	if input.URL != nil && *input.URL != "" {
		query = query.
			Join("studio_urls ON studios.id = studio_urls.studio_id").
			Where(sq.Eq{"studio_urls.url": *input.URL})
	}

	// Filter by name only
	if input.Name != nil && *input.Name != "" {
		searchTerm := "%" + *input.Name + "%"
		query = query.Where(sq.ILike{"studios.name": searchTerm})
	}

	// Filter by names (searches studio name, parent name, and aliases)
	if input.Names != nil && *input.Names != "" {
		searchTerm := "%" + *input.Names + "%"
		existsClause := fmt.Sprintf(
			"EXISTS (SELECT S.id FROM studios S LEFT JOIN studio_aliases SA ON S.id = SA.studio_id WHERE studios.id = S.id AND (LOWER(S.name) LIKE %s OR LOWER(SA.alias) LIKE %s) GROUP BY S.id)",
			sq.Placeholders(1), sq.Placeholders(1),
		)
		orConditions := sq.Or{
			sq.ILike{"studios.name": searchTerm},
			sq.ILike{"parent_studio.name": searchTerm},
			sq.Expr(existsClause, strings.ToLower(searchTerm), strings.ToLower(searchTerm)),
		}
		query = query.Where(orConditions)
	}

	// Filter by has parent
	if input.HasParent != nil {
		if *input.HasParent {
			query = query.Where("parent_studio.id IS NOT NULL")
		} else {
			query = query.Where("parent_studio.id IS NULL")
		}
	}

	// Filter by favorite status
	if input.IsFavorite != nil {
		if *input.IsFavorite {
			query = query.
				Join("studio_favorites F ON studios.id = F.studio_id").
				Where(sq.Eq{"F.user_id": userID})
		} else {
			query = query.
				LeftJoin("studio_favorites F ON studios.id = F.studio_id AND F.user_id = ?", userID).
				Where("F.studio_id IS NULL")
		}
	}

	return query
}
