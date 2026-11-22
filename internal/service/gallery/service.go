// Package gallery provides gallery persistence and relationship operations.
package gallery

import (
	"context"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
)

const galleryColumns = `id, title, code, TO_CHAR(date, 'YYYY-MM-DD'), photographer, details,
	studio_id, cover_image_id, deleted, created_at, updated_at`

type Gallery struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

func NewGallery(q *queries.Queries, withTxn queries.WithTxnFunc) *Gallery {
	return &Gallery{queries: q, withTxn: withTxn}
}

func (s *Gallery) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

func (s *Gallery) FindByID(ctx context.Context, id uuid.UUID) (*models.Gallery, error) {
	gallery, err := scanGallery(s.queries.DB().QueryRow(ctx, "SELECT "+galleryColumns+" FROM galleries WHERE id = $1", id))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return &gallery, nil
}

func (s *Gallery) GetEdits(ctx context.Context, id uuid.UUID) ([]models.Edit, error) {
	edits, err := s.queries.GetEditsByGallery(ctx, id)
	return converter.EditsToModels(edits), err
}

func (s *Gallery) FindBySceneID(ctx context.Context, sceneID uuid.UUID) ([]models.Gallery, error) {
	rows, err := s.queries.DB().Query(ctx, `
		SELECT `+galleryColumns+`
		FROM galleries
		JOIN gallery_scenes ON gallery_scenes.gallery_id = galleries.id
		WHERE gallery_scenes.scene_id = $1 AND galleries.deleted = FALSE
		ORDER BY galleries.date DESC NULLS LAST, galleries.id`, sceneID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []models.Gallery
	for rows.Next() {
		gallery, err := scanGallery(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, gallery)
	}
	return result, rows.Err()
}

func (s *Gallery) LoadIDs(ctx context.Context, ids []uuid.UUID) ([]*models.Gallery, []error) {
	galleries, err := findGalleriesByIDs(ctx, s.queries, ids, false)
	if err != nil {
		errs := make([]error, len(ids))
		for i := range errs {
			errs[i] = err
		}
		return make([]*models.Gallery, len(ids)), errs
	}

	byID := make(map[uuid.UUID]*models.Gallery, len(galleries))
	for i := range galleries {
		gallery := galleries[i]
		byID[gallery.ID] = &gallery
	}
	result := make([]*models.Gallery, len(ids))
	for i, id := range ids {
		result[i] = byID[id]
	}
	return result, make([]error, len(ids))
}

func (s *Gallery) Create(ctx context.Context, input models.GalleryCreateInput) (*models.Gallery, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}
	return s.CreateWithID(ctx, id, input)
}

func (s *Gallery) CreateWithID(ctx context.Context, id uuid.UUID, input models.GalleryCreateInput) (*models.Gallery, error) {
	if err := validateDate(input.Date); err != nil {
		return nil, err
	}

	var gallery models.Gallery
	err := s.withTxn(func(tx *queries.Queries) error {
		created, err := insertGallery(ctx, tx, id, input.Title, input.Code, input.Date,
			input.Photographer, input.Details, input.StudioID, input.CoverImageID)
		if err != nil {
			return err
		}
		gallery = created
		if err := setURLs(ctx, tx, id, input.URLs); err != nil {
			return err
		}
		if err := setPerformers(ctx, tx, id, input.Performers); err != nil {
			return err
		}
		if err := setTags(ctx, tx, id, input.TagIDs); err != nil {
			return err
		}
		if err := setScenes(ctx, tx, id, input.SceneIDs); err != nil {
			return err
		}
		return setImages(ctx, tx, id, input.Images)
	})
	return &gallery, err
}

func (s *Gallery) Update(ctx context.Context, input models.GalleryUpdateInput) (*models.Gallery, error) {
	if err := validateDate(input.Date); err != nil {
		return nil, err
	}
	existing, err := s.FindByID(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	applyGalleryUpdate(existing, input)

	var gallery models.Gallery
	err = s.withTxn(func(tx *queries.Queries) error {
		updated, err := updateGallery(ctx, tx, existing)
		if err != nil {
			return err
		}
		gallery = updated
		if err := setURLs(ctx, tx, input.ID, input.URLs); err != nil {
			return err
		}
		if err := setPerformers(ctx, tx, input.ID, input.Performers); err != nil {
			return err
		}
		if err := setTags(ctx, tx, input.ID, input.TagIDs); err != nil {
			return err
		}
		if err := setScenes(ctx, tx, input.ID, input.SceneIDs); err != nil {
			return err
		}
		return nil
	})
	return &gallery, err
}

func (s *Gallery) Replace(ctx context.Context, gallery *models.Gallery, urls []models.URL, performers []models.PerformerAppearanceInput, tags, scenes []uuid.UUID) error {
	return s.withTxn(func(tx *queries.Queries) error {
		if _, err := updateGallery(ctx, tx, gallery); err != nil {
			return err
		}
		if err := setURLs(ctx, tx, gallery.ID, urls); err != nil {
			return err
		}
		if err := setPerformers(ctx, tx, gallery.ID, performers); err != nil {
			return err
		}
		if err := setTags(ctx, tx, gallery.ID, tags); err != nil {
			return err
		}
		return setScenes(ctx, tx, gallery.ID, scenes)
	})
}

func (s *Gallery) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := s.queries.DB().Exec(ctx, "DELETE FROM galleries WHERE id = $1", id)
	return err
}

func (s *Gallery) SoftDelete(ctx context.Context, id uuid.UUID) (*models.Gallery, error) {
	gallery, err := scanGallery(s.queries.DB().QueryRow(ctx,
		"UPDATE galleries SET deleted = TRUE, updated_at = NOW() WHERE id = $1 RETURNING "+galleryColumns, id))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return &gallery, nil
}

func (s *Gallery) Restore(ctx context.Context, id uuid.UUID) (*models.Gallery, error) {
	gallery, err := scanGallery(s.queries.DB().QueryRow(ctx,
		"UPDATE galleries SET deleted = FALSE, updated_at = NOW() WHERE id = $1 RETURNING "+galleryColumns, id))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return &gallery, nil
}

func insertGallery(
	ctx context.Context,
	q *queries.Queries,
	id uuid.UUID,
	title, code, date, photographer, details *string,
	studioID, coverImageID *uuid.UUID,
) (models.Gallery, error) {
	studio, cover := nullableUUID(studioID), nullableUUID(coverImageID)
	return scanGallery(q.DB().QueryRow(ctx, `
		INSERT INTO galleries
			(id, title, code, date, photographer, details, studio_id, cover_image_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING `+galleryColumns,
		id, title, code, date, photographer, details, studio, cover))
}

func updateGallery(ctx context.Context, q *queries.Queries, gallery *models.Gallery) (models.Gallery, error) {
	return scanGallery(q.DB().QueryRow(ctx, `
		UPDATE galleries
		SET title = $2, code = $3, date = $4, photographer = $5, details = $6,
		    studio_id = $7, cover_image_id = $8, updated_at = NOW()
		WHERE id = $1
		RETURNING `+galleryColumns,
		gallery.ID, gallery.Title, gallery.Code, gallery.Date, gallery.Photographer,
		gallery.Details, gallery.StudioID, gallery.CoverImageID))
}

func applyGalleryUpdate(gallery *models.Gallery, input models.GalleryUpdateInput) {
	if input.Title != nil {
		gallery.Title = input.Title
	}
	if input.Code != nil {
		gallery.Code = input.Code
	}
	if input.Date != nil {
		gallery.Date = input.Date
	}
	if input.Photographer != nil {
		gallery.Photographer = input.Photographer
	}
	if input.Details != nil {
		gallery.Details = input.Details
	}
	if input.StudioID != nil {
		gallery.StudioID = uuid.NullUUID{UUID: *input.StudioID, Valid: true}
	}
	if input.CoverImageID != nil {
		gallery.CoverImageID = uuid.NullUUID{UUID: *input.CoverImageID, Valid: true}
	}
}

func nullableUUID(id *uuid.UUID) uuid.NullUUID {
	if id == nil {
		return uuid.NullUUID{}
	}
	return uuid.NullUUID{UUID: *id, Valid: true}
}

func validateDate(date *string) error {
	if date == nil || *date == "" {
		return nil
	}
	if _, err := time.Parse("2006-01-02", *date); err != nil {
		return fmt.Errorf("gallery date must use YYYY-MM-DD: %w", err)
	}
	return nil
}

func scanGallery(row pgx.Row) (models.Gallery, error) {
	var gallery models.Gallery
	err := row.Scan(
		&gallery.ID,
		&gallery.Title,
		&gallery.Code,
		&gallery.Date,
		&gallery.Photographer,
		&gallery.Details,
		&gallery.StudioID,
		&gallery.CoverImageID,
		&gallery.Deleted,
		&gallery.CreatedAt,
		&gallery.UpdatedAt,
	)
	return gallery, err
}

func findGalleriesByIDs(
	ctx context.Context,
	q *queries.Queries,
	ids []uuid.UUID,
	includeDeleted bool,
) ([]models.Gallery, error) {
	if len(ids) == 0 {
		return []models.Gallery{}, nil
	}
	deletedClause := " AND deleted = FALSE"
	if includeDeleted {
		deletedClause = ""
	}
	rows, err := q.DB().Query(ctx, "SELECT "+galleryColumns+" FROM galleries WHERE id = ANY($1::UUID[])"+deletedClause, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.Gallery
	for rows.Next() {
		gallery, err := scanGallery(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, gallery)
	}
	return result, rows.Err()
}
