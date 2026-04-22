package performer

import (
	"context"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
)

var orderedCupSizes = []string{
	"AAA", "AA", "A", "BB", "B", "CC", "C", "D", "DD", "DDD", "DDDD", "DDDDD",
	"E", "EE", "EEE", "F", "FF", "FFF", "G", "GG", "GGG", "H", "HH",
	"I", "II", "J", "JJ", "JJJ", "K", "KK", "L", "M", "MM", "N", "NN",
	"O", "OO", "P", "PPP", "Q", "QQ", "R", "S", "T", "U", "W", "XXX", "Z", "ZZZ",
}

var cupSizeRanks = func() map[string]int {
	ranks := make(map[string]int, len(orderedCupSizes))
	for i, cupSize := range orderedCupSizes {
		ranks[cupSize] = i + 1
	}
	return ranks
}()

func (s *Performer) Query(ctx context.Context, input models.PerformerQueryInput) ([]models.Performer, error) {
	user := auth.GetCurrentUser(ctx)

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query := s.buildPerformerQuery(psql, input, user.ID, false)

	// Apply sort
	query = s.applyPerformerSort(query, input)

	// Apply pagination
	query = queryhelper.ApplyPagination(query, input.Page, input.PerPage)

	return queryhelper.ExecuteQuery(ctx, query, s.queries.DB(), converter.PerformerToModel, "QueryPerformers")
}

func (s *Performer) QueryCount(ctx context.Context, input models.PerformerQueryInput) (int, error) {
	user := auth.GetCurrentUser(ctx)

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query := s.buildPerformerQuery(psql, input, user.ID, true)

	return queryhelper.ExecuteCount(ctx, query, s.queries.DB(), "QueryPerformersCount")
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
			query = psql.Select("performers.*").From("performers").
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
		query = queryhelper.ApplyIntCriterion(query, "EXTRACT(YEAR FROM to_date(performers.birthdate, 'YYYY-MM-DD'))::int", input.BirthYear)
	}

	// Filter by birthdate
	if input.Birthdate != nil {
		query = queryhelper.ApplyDateCriterion(query, "performers.birthdate", input.Birthdate)
	}

	// Filter by deathdate
	if input.Deathdate != nil {
		query = queryhelper.ApplyDateCriterion(query, "performers.deathdate", input.Deathdate)
	}

	// Filter by age
	if input.Age != nil {
		ageExpr := "EXTRACT(YEAR FROM AGE(COALESCE(to_date(performers.deathdate, 'YYYY-MM-DD'), CURRENT_DATE), to_date(performers.birthdate, 'YYYY-MM-DD')))::int"
		query = queryhelper.ApplyIntCriterion(query, ageExpr, input.Age)
	}

	// Filter by height
	if input.Height != nil {
		query = queryhelper.ApplyIntCriterion(query, "performers.height", input.Height)
	}

	// Filter by band size
	if input.BandSize != nil {
		query = queryhelper.ApplyIntCriterion(query, "performers.band_size", input.BandSize)
	}

	// Filter by waist size
	if input.WaistSize != nil {
		query = queryhelper.ApplyIntCriterion(query, "performers.waist_size", input.WaistSize)
	}

	// Filter by hip size
	if input.HipSize != nil {
		query = queryhelper.ApplyIntCriterion(query, "performers.hip_size", input.HipSize)
	}

	// Filter by career start year
	if input.CareerStartYear != nil {
		query = queryhelper.ApplyIntCriterion(query, "performers.career_start_year", input.CareerStartYear)
	}

	// Filter by career end year
	if input.CareerEndYear != nil {
		query = queryhelper.ApplyIntCriterion(query, "performers.career_end_year", input.CareerEndYear)
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

	// Filter by cup size
	if input.CupSize != nil {
		query = applyCupSizeCriterion(query, "performers.cup_size", input.CupSize)
	}

	// Filter by eye color
	if input.EyeColor != nil {
		var value *string
		if input.EyeColor.Value != nil {
			value = enumCriterionStringValue(input.EyeColor.Value)
		}
		query = queryhelper.ApplyStringValueCriterion(query, "performers.eye_color", value, input.EyeColor.Modifier)
	}

	// Filter by hair color
	if input.HairColor != nil {
		var value *string
		if input.HairColor.Value != nil {
			value = enumCriterionStringValue(input.HairColor.Value)
		}
		query = queryhelper.ApplyStringValueCriterion(query, "performers.hair_color", value, input.HairColor.Modifier)
	}

	// Filter by breast type
	if input.BreastType != nil {
		var value *string
		if input.BreastType.Value != nil {
			value = enumCriterionStringValue(input.BreastType.Value)
		}
		query = queryhelper.ApplyStringValueCriterion(query, "performers.breast_type", value, input.BreastType.Modifier)
	}

	// Only non-deleted performers
	query = query.Where(sq.Eq{"deleted": false})

	return query
}

func enumCriterionStringValue(value interface{ String() string }) *string {
	str := value.String()
	return &str
}

func applyCupSizeCriterion(query sq.SelectBuilder, field string, criterion *models.StringCriterionInput) sq.SelectBuilder {
	normalizedField := normalizedCupSizeExpression(field)
	normalizedValue := normalizeCupSizeValue(criterion.Value)

	switch criterion.Modifier {
	case models.CriterionModifierEquals:
		return query.Where(sq.Expr(normalizedField+" = ?", normalizedValue))
	case models.CriterionModifierNotEquals:
		return query.Where(sq.Expr(normalizedField+" <> ?", normalizedValue))
	case models.CriterionModifierGreaterThan:
		// Ordered cup-size comparisons only apply to known ranked values.
		// Unknown query values produce no matches, and unknown stored values rank as NULL.
		rank, ok := cupSizeRanks[normalizedValue]
		if !ok {
			return query.Where("1 = 0")
		}
		return query.Where(sq.Expr(cupSizeRankExpression(field)+" > ?", rank))
	case models.CriterionModifierLessThan:
		rank, ok := cupSizeRanks[normalizedValue]
		if !ok {
			return query.Where("1 = 0")
		}
		return query.Where(sq.Expr(cupSizeRankExpression(field)+" < ?", rank))
	case models.CriterionModifierIsNull:
		return query.Where(field + " IS NULL")
	case models.CriterionModifierNotNull:
		return query.Where(field + " IS NOT NULL")
	default:
		return query
	}
}

func normalizeCupSizeValue(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func normalizedCupSizeExpression(field string) string {
	return fmt.Sprintf("UPPER(TRIM(%s))", field)
}

func cupSizeRankExpression(field string) string {
	normalizedField := normalizedCupSizeExpression(field)
	var builder strings.Builder
	builder.WriteString("CASE ")
	for _, cupSize := range orderedCupSizes {
		fmt.Fprintf(&builder, "WHEN %s = '%s' THEN %d ", normalizedField, cupSize, cupSizeRanks[cupSize])
	}
	builder.WriteString("ELSE NULL END")
	return builder.String()
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
			query = query.LeftJoin(`(
				SELECT performer_id, MIN(date) as debut
				FROM scene_performers
				JOIN scenes ON scene_id = id
				GROUP BY performer_id
			) D ON performers.id = D.performer_id`)
		}
		return query.OrderBy(fmt.Sprintf("debut %s NULLS LAST, name %s", sortDir, sortDir))
	case models.PerformerSortEnumLastScene:
		if !needsStudioJoin {
			query = query.LeftJoin(`(
				SELECT performer_id, MAX(date) as last_scene
				FROM scene_performers
				JOIN scenes ON scene_id = id
				GROUP BY performer_id
			) D ON performers.id = D.performer_id`)
		}
		return query.OrderBy(fmt.Sprintf("last_scene %s NULLS LAST, name %s", sortDir, sortDir))
	case models.PerformerSortEnumSceneCount:
		if !needsStudioJoin {
			query = query.LeftJoin(`(
				SELECT performer_id, COUNT(*) as scene_count
				FROM scene_performers
				GROUP BY performer_id
			) D ON performers.id = D.performer_id`)
		}
		return query.OrderBy(fmt.Sprintf("COALESCE(scene_count, 0) %s, name %s", sortDir, sortDir))
	default:
		if input.Sort != "" {
			sortField = strings.ToLower(input.Sort.String())
		}
		return query.OrderBy(fmt.Sprintf("%s %s", sortField, sortDir))
	}
}
