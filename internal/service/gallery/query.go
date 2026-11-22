package gallery

import (
	"context"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
)

func (s *Gallery) Query(ctx context.Context, input models.GalleryQueryInput) ([]models.Gallery, error) {
	return s.QueryForPerformer(ctx, input, nil)
}

func (s *Gallery) QueryForPerformer(ctx context.Context, input models.GalleryQueryInput, performerID *uuid.UUID) ([]models.Gallery, error) {
	query, err := buildGalleryQuery(input, performerID, false)
	if err != nil {
		return nil, err
	}

	ids, err := queryhelper.ExecuteIDQuery(ctx, query, s.queries.DB(), "QueryGalleries")
	if err != nil {
		return nil, err
	}
	loaded, errs := s.LoadIDs(ctx, ids)
	result := make([]models.Gallery, 0, len(loaded))
	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}
	for _, gallery := range loaded {
		if gallery != nil {
			result = append(result, *gallery)
		}
	}
	return result, nil
}

func (s *Gallery) Search(ctx context.Context, term string, limit, offset int) (*models.GalleryQuery, error) {
	trimmed := strings.TrimSpace(term)
	if id, err := uuid.FromString(trimmed); err == nil {
		gallery, err := s.FindByID(ctx, id)
		result := &models.GallerySearchResults{}
		if gallery != nil {
			result.Galleries = []models.Gallery{*gallery}
			result.Count = 1
		}
		return &models.GalleryQuery{SearchResults: result}, err
	}

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	searchTerm := "%" + trimmed + "%"
	base := psql.Select("galleries.id").From("galleries").
		Where("galleries.deleted = FALSE").
		Where(sq.Or{
			sq.ILike{"galleries.title": searchTerm},
			sq.ILike{"galleries.code": searchTerm},
			sq.ILike{"galleries.photographer": searchTerm},
			sq.Expr(`EXISTS (
				SELECT 1 FROM gallery_performers GP
				JOIN performers P ON P.id = GP.performer_id
				WHERE GP.gallery_id = galleries.id
				AND (P.name ILIKE ? OR EXISTS (
					SELECT 1 FROM performer_aliases PA
					WHERE PA.performer_id = P.id AND PA.alias ILIKE ?
				))
			)`, searchTerm, searchTerm),
			sq.Expr(`EXISTS (
				SELECT 1 FROM studios S
				WHERE S.id = galleries.studio_id
				AND (S.name ILIKE ? OR EXISTS (
					SELECT 1 FROM studio_aliases SA
					WHERE SA.studio_id = S.id AND SA.alias ILIKE ?
				))
			)`, searchTerm, searchTerm),
		})

	ids, err := queryhelper.ExecuteIDQuery(ctx,
		base.OrderBy("galleries.title", "galleries.id").Limit(uint64(limit)).Offset(uint64(offset)),
		s.queries.DB(), "SearchGalleries")
	if err != nil {
		return nil, err
	}
	galleryPtrs, errs := s.LoadIDs(ctx, ids)
	galleries := make([]models.Gallery, 0, len(galleryPtrs))
	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}
	for _, gallery := range galleryPtrs {
		if gallery != nil {
			galleries = append(galleries, *gallery)
		}
	}
	count, err := queryhelper.ExecuteCountCustomPlan(
		ctx,
		psql.Select("COUNT(*)").FromSelect(base, "gallery_matches"),
		s.queries.DB(),
		"SearchGalleriesCount",
	)
	return &models.GalleryQuery{
		SearchResults: &models.GallerySearchResults{
			Galleries: galleries,
			Count:     count,
		},
	}, err
}

func (s *Gallery) QueryCount(ctx context.Context, input models.GalleryQueryInput) (int, error) {
	return s.QueryCountForPerformer(ctx, input, nil)
}

func (s *Gallery) QueryCountForPerformer(ctx context.Context, input models.GalleryQueryInput, performerID *uuid.UUID) (int, error) {
	query, err := buildGalleryQuery(input, performerID, true)
	if err != nil {
		return 0, err
	}
	return queryhelper.ExecuteCountCustomPlan(
		ctx,
		sq.StatementBuilder.PlaceholderFormat(sq.Dollar).Select("COUNT(*)").FromSelect(query, "galleries"),
		s.queries.DB(),
		"QueryGalleriesCount",
	)
}

func buildGalleryQuery(input models.GalleryQueryInput, performerID *uuid.UUID, forCount bool) (sq.SelectBuilder, error) {
	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query := psql.Select("galleries.id").From("galleries").Where("galleries.deleted = FALSE")
	if performerID != nil {
		query = query.Where(sq.Expr(`EXISTS (
			SELECT 1 FROM gallery_performers GP
			WHERE GP.gallery_id = galleries.id AND GP.performer_id = ?
		)`, *performerID))
	}

	if input.Title != nil && *input.Title != "" {
		query = query.Where(sq.ILike{"galleries.title": "%" + *input.Title + "%"})
	}
	if input.Photographer != nil {
		query = queryhelper.ApplyStringCriterion(query, "galleries.photographer", input.Photographer)
	}
	if input.Date != nil {
		switch input.Date.Modifier {
		case models.CriterionModifierEquals:
			query = query.Where(sq.Eq{"galleries.date": input.Date.Value})
		case models.CriterionModifierNotEquals:
			query = query.Where(sq.NotEq{"galleries.date": input.Date.Value})
		case models.CriterionModifierGreaterThan:
			query = query.Where(sq.Gt{"galleries.date": input.Date.Value})
		case models.CriterionModifierLessThan:
			query = query.Where(sq.Lt{"galleries.date": input.Date.Value})
		case models.CriterionModifierIsNull:
			query = query.Where("galleries.date IS NULL")
		case models.CriterionModifierNotNull:
			query = query.Where("galleries.date IS NOT NULL")
		default:
			return query, fmt.Errorf("unsupported modifier %s for galleries.date", input.Date.Modifier)
		}
	}
	if input.Studios != nil && len(input.Studios.Value) > 0 {
		switch input.Studios.Modifier {
		case models.CriterionModifierIncludes, models.CriterionModifierEquals:
			query = query.Where(sq.Eq{"galleries.studio_id": input.Studios.Value})
		case models.CriterionModifierExcludes, models.CriterionModifierNotEquals:
			query = query.Where(sq.Or{sq.Expr("galleries.studio_id IS NULL"), sq.NotEq{"galleries.studio_id": input.Studios.Value}})
		default:
			return query, fmt.Errorf("unsupported modifier %s for galleries.studio_id", input.Studios.Modifier)
		}
	}
	if input.ParentStudio != nil {
		query = query.
			Join("studios ON galleries.studio_id = studios.id").
			Where(sq.Or{
				sq.Eq{"studios.parent_studio_id": *input.ParentStudio},
				sq.Eq{"studios.id": *input.ParentStudio},
			})
	}
	if input.Performers != nil && len(input.Performers.Value) > 0 {
		if err := queryhelper.ApplyMultiIDCriterion(&query, "galleries", "gallery_performers", "gallery_id", "performer_id", input.Performers); err != nil {
			return query, err
		}
	}
	if input.Tags != nil && len(input.Tags.Value) > 0 {
		if err := queryhelper.ApplyMultiIDCriterion(&query, "galleries", "gallery_tags", "gallery_id", "tag_id", input.Tags); err != nil {
			return query, err
		}
	}
	if !forCount {
		field := "date"
		if input.Sort != "" {
			field = strings.ToLower(input.Sort.String())
		}
		direction := "DESC"
		if input.Direction != "" {
			direction = strings.ToUpper(input.Direction.String())
		}
		query = query.OrderBy(fmt.Sprintf("galleries.%s %s NULLS LAST, galleries.id %s", field, direction, direction))
		query = queryhelper.ApplyPagination(query, input.Page, input.PerPage)
	}
	return query, nil
}
