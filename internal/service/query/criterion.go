package query

import (
	"fmt"

	sq "github.com/Masterminds/squirrel"

	"github.com/stashapp/stash-box/internal/models"
)

// ApplyMultiIDCriterion applies multi-ID criterion (includes/includes_all/excludes)
// Modifies the query pointer in place
// tableName: the main table name (e.g., "scenes")
// joinTable: the join table name (e.g., "scene_performers")
// fkColumn: the foreign key column in the join table referencing the main table (e.g., "scene_id")
// joinField: the field in the join table to filter on (e.g., "performer_id")
func ApplyMultiIDCriterion(query *sq.SelectBuilder, tableName, joinTable, fkColumn, joinField string, criterion *models.MultiIDCriterionInput) error {
	switch criterion.Modifier {
	case models.CriterionModifierIncludes:
		// includes any of the provided ids
		subquery := sq.Select(fkColumn).
			From(joinTable).
			Where(sq.Eq{joinField: criterion.Value})
		*query = query.Where(sq.Expr(fmt.Sprintf("%s.id IN (?)", tableName), subquery))
	case models.CriterionModifierIncludesAll:
		// includes all of the provided ids
		subquery := sq.Select(fkColumn).
			From(joinTable).
			Where(sq.Eq{joinField: criterion.Value}).
			GroupBy(fkColumn).
			Having(sq.Eq{"COUNT(*)": len(criterion.Value)})
		*query = query.Where(sq.Expr(fmt.Sprintf("%s.id IN (?)", tableName), subquery))
	case models.CriterionModifierExcludes:
		// excludes all of the provided ids
		subquery := sq.Select(fkColumn).
			From(joinTable).
			Where(sq.Eq{joinField: criterion.Value})
		*query = query.Where(sq.Expr(fmt.Sprintf("%s.id NOT IN (?)", tableName), subquery))
	default:
		return fmt.Errorf("unsupported modifier %s for %s.%s", criterion.Modifier, joinTable, joinField)
	}
	return nil
}

// ApplyIntCriterion applies integer criterion (equals, not equals, greater than, less than, is null, not null)
// Returns the modified query
func ApplyIntCriterion(query sq.SelectBuilder, field string, criterion *models.IntCriterionInput) sq.SelectBuilder {
	switch criterion.Modifier {
	case models.CriterionModifierEquals:
		return query.Where(sq.Eq{field: criterion.Value})
	case models.CriterionModifierNotEquals:
		return query.Where(sq.NotEq{field: criterion.Value})
	case models.CriterionModifierGreaterThan:
		return query.Where(sq.Gt{field: criterion.Value})
	case models.CriterionModifierLessThan:
		return query.Where(sq.Lt{field: criterion.Value})
	case models.CriterionModifierIsNull:
		return query.Where(field + " IS NULL")
	case models.CriterionModifierNotNull:
		return query.Where(field + " IS NOT NULL")
	default:
		return query
	}
}

// ApplyStringCriterion applies string criterion (equals, not equals, is null, not null)
// Returns the modified query
func ApplyStringCriterion(query sq.SelectBuilder, field string, criterion *models.StringCriterionInput) sq.SelectBuilder {
	switch criterion.Modifier {
	case models.CriterionModifierEquals:
		return query.Where(sq.Eq{field: criterion.Value})
	case models.CriterionModifierNotEquals:
		return query.Where(sq.NotEq{field: criterion.Value})
	case models.CriterionModifierIsNull:
		return query.Where(field + " IS NULL")
	case models.CriterionModifierNotNull:
		return query.Where(field + " IS NOT NULL")
	default:
		return query
	}
}

// ApplyDateCriterion applies date criterion (equals, not equals, greater than, less than, is null, not null)
// Returns the modified query
func ApplyDateCriterion(query sq.SelectBuilder, field string, criterion *models.DateCriterionInput) sq.SelectBuilder {
	switch criterion.Modifier {
	case models.CriterionModifierEquals:
		return query.Where(sq.Eq{field: criterion.Value})
	case models.CriterionModifierNotEquals:
		return query.Where(sq.NotEq{field: criterion.Value})
	case models.CriterionModifierGreaterThan:
		return query.Where(sq.Gt{field: criterion.Value})
	case models.CriterionModifierLessThan:
		return query.Where(sq.Lt{field: criterion.Value})
	case models.CriterionModifierIsNull:
		return query.Where(field + " IS NULL")
	case models.CriterionModifierNotNull:
		return query.Where(field + " IS NOT NULL")
	default:
		return query
	}
}
