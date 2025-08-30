package performer

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

func (s *Performer) Query(ctx context.Context, input models.PerformerQueryInput) ([]*models.Performer, error) {
	user := auth.GetCurrentUser(ctx)

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query := s.buildPerformerQuery(psql, input, user.ID, false)

	// Apply sort
	query = s.applyPerformerSort(query, input)

	// Apply pagination
	query = queryhelper.ApplyPagination(query, input.Page, input.PerPage)

	return queryhelper.ExecuteQuery(ctx, query, s.queries.DB(), converter.PerformerToModel)
}

func (s *Performer) QueryCount(ctx context.Context, input models.PerformerQueryInput) (int, error) {
	user := auth.GetCurrentUser(ctx)

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query := s.buildPerformerQuery(psql, input, user.ID, true)

	return queryhelper.ExecuteCount(ctx, query, s.queries.DB())
}

func (s *Performer) buildPerformerQuery(psql sq.StatementBuilderType, input models.PerformerQueryInput, userID uuid.UUID, forCount bool) sq.SelectBuilder {
	var query sq.SelectBuilder
	needsStudioJoin := input.StudioID != nil

	// Build base query with studio join if needed
	if forCount {
		if needsStudioJoin {
			query = psql.Select("COUNT(DISTINCT performers.id)").From("performers").
				Join(`(
					SELECT performer_id, MIN(date) as debut, MAX(date) AS last_scene, COUNT(*) as scene_count
					FROM scene_performers
					JOIN scenes ON scene_id = id AND studio_id = ?
					GROUP BY performer_id
				) D ON performers.id = D.performer_id`, input.StudioID)
		} else {
			query = psql.Select("COUNT(*)").From("performers")
		}
	} else {
		if needsStudioJoin {
			query = psql.Select("DISTINCT performers.*").From("performers").
				Join(`(
					SELECT performer_id, MIN(date) as debut, MAX(date) AS last_scene, COUNT(*) as scene_count
					FROM scene_performers
					JOIN scenes ON scene_id = id AND studio_id = ?
					GROUP BY performer_id
				) D ON performers.id = D.performer_id`, input.StudioID)
		} else {
			query = psql.Select("performers.*").From("performers")
		}
	}

	// Filter by URL
	if input.URL != nil && *input.URL != "" {
		query = query.
			Join("performer_urls ON performers.id = performer_urls.performer_id").
			Where(sq.Eq{"performer_urls.url": *input.URL})
	}

	// Filter by name only
	if input.Name != nil && *input.Name != "" {
		searchTerm := "%" + *input.Name + "%"
		query = query.Where(sq.ILike{"performers.name": searchTerm})
	}

	// Filter by names (searches name and disambiguation)
	if input.Names != nil && *input.Names != "" {
		searchTerm := "%" + *input.Names + "%"
		query = query.Where(sq.Or{
			sq.ILike{"performers.name": searchTerm},
			sq.ILike{"performers.disambiguation": searchTerm},
		})
	}

	// Filter by birth year
	if input.BirthYear != nil {
		query = queryhelper.ApplyIntCriterion(query, "EXTRACT(YEAR FROM performers.birthdate)::int", input.BirthYear)
	}

	// Filter by age
	if input.Age != nil {
		ageExpr := "EXTRACT(YEAR FROM AGE(COALESCE(performers.deathdate, CURRENT_DATE), performers.birthdate))::int"
		query = queryhelper.ApplyIntCriterion(query, ageExpr, input.Age)
	}

	// Filter by gender
	if input.Gender != nil && *input.Gender != "" {
		if *input.Gender == models.GenderFilterEnumUnknown {
			query = query.Where("performers.gender IS NULL")
		} else {
			query = query.Where(sq.Eq{"performers.gender": input.Gender.String()})
		}
	}

	// Filter by ethnicity
	if input.Ethnicity != nil && *input.Ethnicity != "" {
		if *input.Ethnicity == models.EthnicityFilterEnumUnknown {
			query = query.Where("performers.ethnicity IS NULL")
		} else {
			query = query.Where(sq.Eq{"performers.ethnicity": input.Ethnicity.String()})
		}
	}

	// Filter by favorite status
	if input.IsFavorite != nil {
		if *input.IsFavorite {
			query = query.
				Join("performer_favorites F ON performers.id = F.performer_id").
				Where(sq.Eq{"F.user_id": userID})
		} else {
			query = query.
				LeftJoin("performer_favorites F ON performers.id = F.performer_id AND F.user_id = ?", userID).
				Where("F.performer_id IS NULL")
		}
	}

	// Filter by performed with
	if input.PerformedWith != nil {
		subquery := `
			performers.id IN (
				SELECT SP.performer_id FROM scene_performers SP
				JOIN scene_performers SPP ON SP.scene_id = SPP.scene_id
				WHERE SPP.performer_id = ? AND SP.performer_id != ?
				GROUP BY SP.performer_id
			)`
		query = query.Where(sq.Expr(subquery, input.PerformedWith, input.PerformedWith))
	}

	// String criteria
	if input.Disambiguation != nil {
		query = queryhelper.ApplyStringCriterion(query, "disambiguation", input.Disambiguation)
	}
	if input.Country != nil {
		query = queryhelper.ApplyStringCriterion(query, "country", input.Country)
	}

	// Only non-deleted performers
	query = query.Where(sq.Eq{"deleted": false})

	return query
}

func (s *Performer) applyPerformerSort(query sq.SelectBuilder, input models.PerformerQueryInput) sq.SelectBuilder {
	sortField := "name"
	sortDir := "ASC"
	if input.Direction != "" {
		sortDir = strings.ToUpper(input.Direction.String())
	}

	needsStudioJoin := input.StudioID != nil

	switch input.Sort {
	case models.PerformerSortEnumDebut:
		if !needsStudioJoin {
			query = query.Join(`(
				SELECT performer_id, MIN(date) as debut
				FROM scene_performers
				JOIN scenes ON scene_id = id
				GROUP BY performer_id
			) D ON performers.id = D.performer_id`)
		}
		return query.OrderBy(fmt.Sprintf("debut %s NULLS LAST, name %s", sortDir, sortDir))
	case models.PerformerSortEnumLastScene:
		if !needsStudioJoin {
			query = query.Join(`(
				SELECT performer_id, MAX(date) as last_scene
				FROM scene_performers
				JOIN scenes ON scene_id = id
				GROUP BY performer_id
			) D ON performers.id = D.performer_id`)
		}
		return query.OrderBy(fmt.Sprintf("last_scene %s NULLS LAST, name %s", sortDir, sortDir))
	case models.PerformerSortEnumSceneCount:
		if !needsStudioJoin {
			query = query.Join(`(
				SELECT performer_id, COUNT(*) as scene_count
				FROM scene_performers
				GROUP BY performer_id
			) D ON performers.id = D.performer_id`)
		}
		return query.OrderBy(fmt.Sprintf("scene_count %s NULLS LAST, name %s", sortDir, sortDir))
	default:
		if input.Sort != "" {
			sortField = strings.ToLower(input.Sort.String())
		}
		return query.OrderBy(fmt.Sprintf("%s %s", sortField, sortDir))
	}
}
