package edit

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/converter"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	"github.com/stashapp/stash-box/pkg/models"
)

func (s *Edit) QueryCount(ctx context.Context, filter models.EditQueryInput) (int, error) {
	user := auth.GetCurrentUser(ctx)

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query, err := s.buildEditQuery(psql, filter, user.ID, true)
	if err != nil {
		return 0, err
	}

	return queryhelper.ExecuteCount(ctx, query, s.queries.DB())
}

func (s *Edit) QueryEdits(ctx context.Context, filter models.EditQueryInput) ([]models.Edit, error) {
	user := auth.GetCurrentUser(ctx)

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query, err := s.buildEditQuery(psql, filter, user.ID, false)
	if err != nil {
		return nil, err
	}

	// Apply sort
	sortField := "created_at"
	sortDir := "DESC"
	if filter.Sort != "" {
		sortField = strings.ToLower(filter.Sort.String())
	}
	if filter.Direction != "" {
		sortDir = strings.ToUpper(filter.Direction.String())
	}

	// Special handling for closed_at and updated_at - use created_at as fallback
	if filter.Sort == models.EditSortEnumClosedAt || filter.Sort == models.EditSortEnumUpdatedAt {
		query = query.OrderBy(fmt.Sprintf("COALESCE(edits.%s, edits.created_at) %s, edits.id %s", sortField, sortDir, sortDir))
	} else {
		query = query.OrderBy(fmt.Sprintf("edits.%s %s, edits.id %s", sortField, sortDir, sortDir))
	}

	// Apply pagination
	query = queryhelper.ApplyPagination(query, filter.Page, filter.PerPage)

	return queryhelper.ExecuteQuery(ctx, query, s.queries.DB(), converter.EditToModel)
}

func (s *Edit) buildEditQuery(psql sq.StatementBuilderType, filter models.EditQueryInput, userID uuid.UUID, forCount bool) (sq.SelectBuilder, error) {
	var query sq.SelectBuilder
	if forCount {
		query = psql.Select("COUNT(DISTINCT edits.id)").From("edits")
	} else {
		query = psql.Select("edits.*").From("edits")
	}

	// Filter by voted status
	if filter.Voted != nil && *filter.Voted != "" {
		switch *filter.Voted {
		case models.UserVotedFilterEnumNotVoted:
			query = query.
				LeftJoin("edit_votes ON edits.id = edit_votes.edit_id AND edit_votes.user_id = ?", userID).
				Where("edit_votes.user_id IS NULL")
		default:
			query = query.
				Join("edit_votes ON edits.id = edit_votes.edit_id").
				Where(sq.Eq{"edit_votes.user_id": userID, "edit_votes.vote": filter.Voted.String()})
		}
	}

	// Filter by target ID
	if filter.TargetID != nil {
		if filter.TargetType == nil || *filter.TargetType == "" {
			return query, errors.New("TargetType is required when TargetID filter is used")
		}

		jsonID, _ := json.Marshal(*filter.TargetID)
		targetType := strings.ToLower(filter.TargetType.String())

		switch *filter.TargetType {
		case models.TargetTypeEnumPerformer:
			subquery := fmt.Sprintf(`
				edits.id IN (
					SELECT id FROM edits E WHERE E.data->'merge_sources' @> ?
					UNION
					SELECT edit_id FROM %s_edits WHERE %s_id = ?
					UNION
					SELECT id FROM edits E
					WHERE jsonb_path_query_array(data, '$.new_data.added_performers[*].performer_id') @> ?
					AND E.status = 'PENDING' AND E.target_type = 'SCENE'
				)`, targetType, targetType)
			query = query.Where(sq.Expr(subquery, string(jsonID), *filter.TargetID, string(jsonID)))
		case models.TargetTypeEnumStudio:
			subquery := fmt.Sprintf(`
				edits.id IN (
					SELECT id FROM edits E WHERE E.data->'merge_sources' @> ?
					UNION
					SELECT edit_id FROM %s_edits WHERE %s_id = ?
					UNION
					SELECT id FROM edits E
					WHERE E.status = 'PENDING' AND E.target_type = 'SCENE'
					AND E.data->'new_data'->'studio_id' @> ?
				)`, targetType, targetType)
			query = query.Where(sq.Expr(subquery, string(jsonID), *filter.TargetID, string(jsonID)))
		case models.TargetTypeEnumTag:
			subquery := fmt.Sprintf(`
				edits.id IN (
					SELECT id FROM edits E WHERE E.data->'merge_sources' @> ?
					UNION
					SELECT edit_id FROM %s_edits WHERE %s_id = ?
					UNION
					SELECT id FROM edits E
					WHERE E.status = 'PENDING' AND E.target_type = 'SCENE'
					AND E.data->'new_data'->'added_tags' @> ?
				)`, targetType, targetType)
			query = query.Where(sq.Expr(subquery, string(jsonID), *filter.TargetID, string(jsonID)))
		default:
			subquery := fmt.Sprintf(`
				edits.id IN (
					SELECT id FROM edits E WHERE E.data->'merge_sources' @> ?
					UNION
					SELECT edit_id FROM %s_edits WHERE %s_id = ?
				)`, targetType, targetType)
			query = query.Where(sq.Expr(subquery, string(jsonID), *filter.TargetID))
		}
	} else if filter.TargetType != nil && *filter.TargetType != "" {
		query = query.Where(sq.Eq{"target_type": filter.TargetType.String()})
	}

	// Filter by favorite status
	if filter.IsFavorite != nil && *filter.IsFavorite {
		favoriteClause := `
			edits.id IN (
				(SELECT TE.edit_id FROM studio_favorites TF JOIN studio_edits TE ON TF.studio_id = TE.studio_id WHERE TF.user_id = ?)
				UNION
				(SELECT PE.edit_id FROM performer_favorites PF JOIN performer_edits PE ON PF.performer_id = PE.performer_id WHERE PF.user_id = ?)
				UNION
				(SELECT SE.edit_id FROM studio_favorites TF JOIN scenes S ON TF.studio_id = S.studio_id JOIN scene_edits SE ON S.id = SE.scene_id WHERE TF.user_id = ?)
				UNION
				(SELECT E.id FROM performer_favorites PF JOIN edits E ON E.data->'merge_sources' @> to_jsonb(PF.performer_id::TEXT)
				 WHERE E.target_type = 'PERFORMER' AND E.operation = 'MERGE' AND PF.user_id = ?)
				UNION
				(SELECT E.id FROM performer_favorites PF JOIN edits E
				 ON jsonb_path_query_array(E.data, '$.new_data.added_performers[*].performer_id') @> to_jsonb(PF.performer_id::TEXT)
				 OR jsonb_path_query_array(E.data, '$.new_data.removed_performers[*].performer_id') @> to_jsonb(PF.performer_id::TEXT)
				 WHERE E.target_type = 'SCENE' AND PF.user_id = ?)
				UNION
				(SELECT E.id FROM studio_favorites TF JOIN edits E
				 ON data->'new_data'->>'studio_id' = TF.studio_id::TEXT OR data->'old_data'->>'studio_id' = TF.studio_id::TEXT
				 WHERE E.target_type = 'SCENE' AND TF.user_id = ?)
			)
		`
		query = query.Where(sq.Expr(favoriteClause, userID, userID, userID, userID, userID, userID))
	}

	// Simple filters
	if filter.UserID != nil {
		query = query.Where(sq.Eq{"edits.user_id": *filter.UserID})
	}
	if filter.Status != nil {
		query = query.Where(sq.Eq{"status": filter.Status.String()})
	}
	if filter.Operation != nil {
		query = query.Where(sq.Eq{"operation": filter.Operation.String()})
	}
	if filter.Applied != nil {
		query = query.Where(sq.Eq{"applied": *filter.Applied})
	}
	if filter.IsBot != nil {
		query = query.Where(sq.Eq{"bot": *filter.IsBot})
	}
	if filter.IncludeUserSubmitted != nil && !*filter.IncludeUserSubmitted {
		query = query.Where(sq.NotEq{"edits.user_id": userID})
	}

	return query, nil
}
