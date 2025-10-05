package scene

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

func (s *Scene) Query(ctx context.Context, input models.SceneQueryInput) ([]models.Scene, error) {
	user := auth.GetCurrentUser(ctx)

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query, err := s.buildSceneQuery(psql, input, user.ID, false)
	if err != nil {
		return nil, err
	}

	return queryhelper.ExecuteQuery(ctx, query, s.queries.DB(), converter.SceneToModel)
}

func (s *Scene) QueryCount(ctx context.Context, input models.SceneQueryInput) (int, error) {
	user := auth.GetCurrentUser(ctx)

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

	// Build the query selecting scenes.id (not doing a count yet)
	// This allows GROUP BY to work properly
	innerQuery, err := s.buildSceneQuery(psql, input, user.ID, false)
	if err != nil {
		return 0, err
	}

	// Replace the SELECT with just scenes.id for the subquery
	innerQuery = psql.Select("scenes.id").FromSelect(innerQuery, "scenes")

	// Wrap in a COUNT query
	countQuery := psql.Select("COUNT(*)").FromSelect(innerQuery, "subquery")

	return queryhelper.ExecuteCount(ctx, countQuery, s.queries.DB())
}

func (s *Scene) buildSceneQuery(psql sq.StatementBuilderType, input models.SceneQueryInput, userID uuid.UUID, forCount bool) (sq.SelectBuilder, error) {
	query := psql.Select("scenes.*").From("scenes")

	// Filter by URL
	if input.URL != nil && *input.URL != "" {
		query = query.
			Join("scene_urls ON scenes.id = scene_urls.scene_id").
			Where(sq.Eq{"scene_urls.url": *input.URL})
	}

	// Filter by parent studio
	if input.ParentStudio != nil {
		query = query.
			Join("studios ON scenes.studio_id = studios.id").
			Where(sq.Or{
				sq.Eq{"studios.parent_studio_id": *input.ParentStudio},
				sq.Eq{"studios.id": *input.ParentStudio},
			})
	}

	// Filter by performers
	if input.Performers != nil && len(input.Performers.Value) > 0 {
		if err := queryhelper.ApplyMultiIDCriterion(&query, "scenes", "scene_performers", "scene_id", "performer_id", input.Performers); err != nil {
			return query, err
		}
	}

	// Filter by tags
	if input.Tags != nil && len(input.Tags.Value) > 0 {
		if err := queryhelper.ApplyMultiIDCriterion(&query, "scenes", "scene_tags", "scene_id", "tag_id", input.Tags); err != nil {
			return query, err
		}
	}

	// Filter by fingerprints
	if input.Fingerprints != nil && len(input.Fingerprints.Value) > 0 {
		placeholders := make([]string, len(input.Fingerprints.Value))
		args := make([]interface{}, len(input.Fingerprints.Value))
		for i, hash := range input.Fingerprints.Value {
			placeholders[i] = "?"
			args[i] = hash
		}
		query = query.Join(fmt.Sprintf(`(
			SELECT scene_id
			FROM scene_fingerprints SFP
			JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
			WHERE FP.hash IN (%s)
			GROUP BY scene_id
		) T ON scenes.id = T.scene_id`, strings.Join(placeholders, ",")), args...)
	}

	// Filter by has fingerprint submissions
	if input.HasFingerprintSubmissions != nil && *input.HasFingerprintSubmissions {
		query = query.Join(`(
			SELECT scene_id
			FROM scene_fingerprints
			WHERE user_id = ?
			GROUP BY scene_id
		) SFP ON scenes.id = SFP.scene_id`, userID)
	}

	// Filter by text (title and details)
	if input.Text != nil && *input.Text != "" {
		searchTerm := "%" + *input.Text + "%"
		query = query.Where(sq.Or{
			sq.ILike{"scenes.title": searchTerm},
			sq.ILike{"scenes.details": searchTerm},
		})
	}

	// Filter by title only
	if input.Title != nil && *input.Title != "" {
		searchTerm := "%" + *input.Title + "%"
		query = query.Where(sq.ILike{"scenes.title": searchTerm})
	}

	// Filter by studios
	if input.Studios != nil && len(input.Studios.Value) > 0 {
		switch input.Studios.Modifier {
		case models.CriterionModifierEquals:
			query = query.Where(sq.Eq{"scenes.studio_id": input.Studios.Value[0]})
		case models.CriterionModifierNotEquals:
			query = query.Where(sq.NotEq{"scenes.studio_id": input.Studios.Value[0]})
		case models.CriterionModifierIsNull:
			query = query.Where("scenes.studio_id IS NULL")
		case models.CriterionModifierNotNull:
			query = query.Where("scenes.studio_id IS NOT NULL")
		case models.CriterionModifierIncludes:
			query = query.Where(sq.Eq{"scenes.studio_id": input.Studios.Value})
		case models.CriterionModifierExcludes:
			query = query.Where(sq.NotEq{"scenes.studio_id": input.Studios.Value})
		default:
			return query, fmt.Errorf("unsupported modifier %s for scenes.studio_id", input.Studios.Modifier)
		}
	}

	// Filter by date
	if input.Date != nil {
		switch input.Date.Modifier {
		case models.CriterionModifierEquals:
			query = query.Where(sq.Eq{"scenes.date": input.Date.Value})
		case models.CriterionModifierNotEquals:
			query = query.Where(sq.NotEq{"scenes.date": input.Date.Value})
		case models.CriterionModifierGreaterThan:
			query = query.Where(sq.Gt{"scenes.date": input.Date.Value})
		case models.CriterionModifierLessThan:
			query = query.Where(sq.Lt{"scenes.date": input.Date.Value})
		case models.CriterionModifierIsNull:
			query = query.Where("scenes.date IS NULL")
		case models.CriterionModifierNotNull:
			query = query.Where("scenes.date IS NOT NULL")
		default:
			return query, fmt.Errorf("unsupported modifier %s for scenes.date", input.Date.Modifier)
		}
	}

	// Filter by favorites
	if input.Favorites != nil {
		var clauses []string
		var args []interface{}

		if *input.Favorites == models.FavoriteFilterPerformer || *input.Favorites == models.FavoriteFilterAll {
			clauses = append(clauses, `(
				SELECT scene_id FROM performer_favorites PF
				JOIN scene_performers SP ON PF.performer_id = SP.performer_id
				WHERE PF.user_id = ?
			)`)
			args = append(args, userID)
		}
		if *input.Favorites == models.FavoriteFilterStudio || *input.Favorites == models.FavoriteFilterAll {
			clauses = append(clauses, `(
				SELECT S.id FROM studio_favorites SF
				JOIN scenes S ON SF.studio_id = S.studio_id
				WHERE SF.user_id = ?
			)`)
			args = append(args, userID)
		}

		if len(clauses) > 0 {
			query = query.Where(sq.Expr("scenes.id IN ("+strings.Join(clauses, " UNION ")+")", args...))
		}
	}

	// Only non-deleted scenes
	query = query.Where(sq.Eq{"scenes.deleted": false})

	// Apply sort and pagination
	if input.Sort == models.SceneSortEnumTrending {
		// Check if we can optimize by limiting the trending subquery
		// This is only safe when there are no other filters applied
		hasOtherFilters := input.URL != nil || input.ParentStudio != nil ||
			(input.Performers != nil && len(input.Performers.Value) > 0) ||
			(input.Tags != nil && len(input.Tags.Value) > 0) ||
			(input.Fingerprints != nil && len(input.Fingerprints.Value) > 0) ||
			(input.HasFingerprintSubmissions != nil && *input.HasFingerprintSubmissions) ||
			(input.Text != nil && *input.Text != "") ||
			(input.Title != nil && *input.Title != "") ||
			(input.Studios != nil && len(input.Studios.Value) > 0) ||
			input.Date != nil || input.Favorites != nil

		if !hasOtherFilters && !forCount {
			// Optimize: limit the trending subquery directly
			// Note: Use manual pagination here since we're limiting in the subquery
			page := 1
			perPage := 25
			if input.Page > 0 {
				page = input.Page
			}
			if input.PerPage > 0 {
				perPage = input.PerPage
			}
			offset := (page - 1) * perPage

			query = query.Join(fmt.Sprintf(`(
				SELECT scene_id, COUNT(*) AS count
				FROM scene_fingerprints
				WHERE created_at >= (now()::DATE - 7)
				GROUP BY scene_id
				ORDER BY count DESC
				LIMIT %d OFFSET %d
			) TRENDING ON scenes.id = TRENDING.scene_id`, perPage, offset))
			query = query.OrderBy("TRENDING.count DESC, TRENDING.scene_id DESC")
			// Don't apply pagination again below since we already limited in the subquery
		} else {
			// Standard trending query without optimization
			query = query.Join(`(
				SELECT scene_id, COUNT(*) AS count
				FROM scene_fingerprints
				WHERE created_at >= (now()::DATE - 7)
				GROUP BY scene_id
			) TRENDING ON scenes.id = TRENDING.scene_id`)
			query = query.OrderBy("TRENDING.count DESC, TRENDING.scene_id DESC")

			if !forCount {
				query = queryhelper.ApplyPagination(query, input.Page, input.PerPage)
			}
		}
	} else {
		sortField := "title"
		sortDir := "ASC"
		if input.Sort != "" {
			sortField = strings.ToLower(input.Sort.String())
		}
		if input.Direction != "" {
			sortDir = strings.ToUpper(input.Direction.String())
		}

		secondary := "title"
		if input.Sort != models.SceneSortEnumTitle {
			secondary = "id"
		}
		query = query.OrderBy(fmt.Sprintf("scenes.%s %s, scenes.%s %s", sortField, sortDir, secondary, sortDir))

		if !forCount {
			query = queryhelper.ApplyPagination(query, input.Page, input.PerPage)
		}
	}

	return query, nil
}
