package gallery

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

func (s *Gallery) SetURLs(ctx context.Context, galleryID uuid.UUID, urls []models.URL) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return setURLs(ctx, tx, galleryID, urls)
	})
}

func (s *Gallery) SetPerformers(ctx context.Context, galleryID uuid.UUID, performers []models.PerformerAppearanceInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return setPerformers(ctx, tx, galleryID, performers)
	})
}

func (s *Gallery) SetTags(ctx context.Context, galleryID uuid.UUID, tagIDs []uuid.UUID) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return setTags(ctx, tx, galleryID, tagIDs)
	})
}

func (s *Gallery) SetScenes(ctx context.Context, galleryID uuid.UUID, sceneIDs []uuid.UUID) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return setScenes(ctx, tx, galleryID, sceneIDs)
	})
}

func (s *Gallery) GetURLs(ctx context.Context, galleryID uuid.UUID) ([]models.URL, error) {
	urls, err := loadURLs(ctx, s.queries, []uuid.UUID{galleryID})
	if err != nil {
		return nil, err
	}
	return urls[0], nil
}

func (s *Gallery) LoadURLs(ctx context.Context, ids []uuid.UUID) ([][]models.URL, []error) {
	result := make([][]models.URL, len(ids))
	loaded, err := loadURLs(ctx, s.queries, ids)
	if err != nil {
		errs := make([]error, len(ids))
		for i := range errs {
			errs[i] = err
		}
		return result, errs
	}
	return loaded, make([]error, len(ids))
}

func (s *Gallery) GetPerformers(ctx context.Context, galleryID uuid.UUID) ([]models.GalleryPerformer, error) {
	performers, err := loadPerformers(ctx, s.queries, []uuid.UUID{galleryID})
	if err != nil {
		return nil, err
	}
	return performers[0], nil
}

func (s *Gallery) LoadPerformers(ctx context.Context, ids []uuid.UUID) ([][]models.GalleryPerformer, []error) {
	result := make([][]models.GalleryPerformer, len(ids))
	loaded, err := loadPerformers(ctx, s.queries, ids)
	if err != nil {
		errs := make([]error, len(ids))
		for i := range errs {
			errs[i] = err
		}
		return result, errs
	}
	return loaded, make([]error, len(ids))
}

func (s *Gallery) GetTags(ctx context.Context, galleryID uuid.UUID) ([]uuid.UUID, error) {
	relations, err := loadUUIDRelation(ctx, s.queries,
		"SELECT gallery_id, tag_id FROM gallery_tags WHERE gallery_id = ANY($1::UUID[]) ORDER BY tag_id",
		[]uuid.UUID{galleryID})
	if err != nil {
		return nil, err
	}
	return relations[0], nil
}

func (s *Gallery) LoadTags(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	return loadUUIDRelations(ctx, s.queries,
		"SELECT gallery_id, tag_id FROM gallery_tags WHERE gallery_id = ANY($1::UUID[]) ORDER BY tag_id", ids)
}

func (s *Gallery) GetScenes(ctx context.Context, galleryID uuid.UUID) ([]uuid.UUID, error) {
	relations, err := loadUUIDRelation(ctx, s.queries,
		"SELECT gallery_id, scene_id FROM gallery_scenes WHERE gallery_id = ANY($1::UUID[]) ORDER BY scene_id",
		[]uuid.UUID{galleryID})
	if err != nil {
		return nil, err
	}
	return relations[0], nil
}

func (s *Gallery) LoadScenes(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	return loadUUIDRelations(ctx, s.queries,
		"SELECT gallery_id, scene_id FROM gallery_scenes WHERE gallery_id = ANY($1::UUID[]) ORDER BY scene_id", ids)
}

func setURLs(ctx context.Context, q *queries.Queries, galleryID uuid.UUID, urls []models.URL) error {
	if _, err := q.DB().Exec(ctx, "DELETE FROM gallery_urls WHERE gallery_id = $1", galleryID); err != nil {
		return err
	}
	for _, item := range urls {
		if _, err := q.DB().Exec(ctx,
			"INSERT INTO gallery_urls (gallery_id, url, site_id) VALUES ($1, $2, $3)",
			galleryID, item.URL, item.SiteID); err != nil {
			return err
		}
	}
	return nil
}

func setPerformers(ctx context.Context, q *queries.Queries, galleryID uuid.UUID, performers []models.PerformerAppearanceInput) error {
	if _, err := q.DB().Exec(ctx, "DELETE FROM gallery_performers WHERE gallery_id = $1", galleryID); err != nil {
		return err
	}
	for _, performer := range performers {
		if _, err := q.DB().Exec(ctx,
			`INSERT INTO gallery_performers (gallery_id, performer_id, "as") VALUES ($1, $2, $3)`,
			galleryID, performer.PerformerID, performer.As); err != nil {
			return err
		}
	}
	return nil
}

func setTags(ctx context.Context, q *queries.Queries, galleryID uuid.UUID, tagIDs []uuid.UUID) error {
	if _, err := q.DB().Exec(ctx, "DELETE FROM gallery_tags WHERE gallery_id = $1", galleryID); err != nil {
		return err
	}
	for _, tagID := range tagIDs {
		if _, err := q.DB().Exec(ctx,
			"INSERT INTO gallery_tags (gallery_id, tag_id) VALUES ($1, $2)",
			galleryID, tagID); err != nil {
			return err
		}
	}
	return nil
}

func setScenes(ctx context.Context, q *queries.Queries, galleryID uuid.UUID, sceneIDs []uuid.UUID) error {
	if _, err := q.DB().Exec(ctx, "DELETE FROM gallery_scenes WHERE gallery_id = $1", galleryID); err != nil {
		return err
	}
	for _, sceneID := range sceneIDs {
		if _, err := q.DB().Exec(ctx,
			"INSERT INTO gallery_scenes (gallery_id, scene_id) VALUES ($1, $2)",
			galleryID, sceneID); err != nil {
			return err
		}
	}
	return nil
}

func loadURLs(ctx context.Context, q *queries.Queries, ids []uuid.UUID) ([][]models.URL, error) {
	result := make([][]models.URL, len(ids))
	positions := positionsByUUID(ids)
	if len(ids) == 0 {
		return result, nil
	}
	rows, err := q.DB().Query(ctx,
		"SELECT gallery_id, url, site_id FROM gallery_urls WHERE gallery_id = ANY($1::UUID[]) ORDER BY gallery_id, url", ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var galleryID uuid.UUID
		var item models.URL
		if err := rows.Scan(&galleryID, &item.URL, &item.SiteID); err != nil {
			return nil, err
		}
		appendToPositions(result, positions[galleryID], item)
	}
	return result, rows.Err()
}

func loadPerformers(ctx context.Context, q *queries.Queries, ids []uuid.UUID) ([][]models.GalleryPerformer, error) {
	result := make([][]models.GalleryPerformer, len(ids))
	positions := positionsByUUID(ids)
	if len(ids) == 0 {
		return result, nil
	}
	rows, err := q.DB().Query(ctx, `
		SELECT gallery_id, performer_id, "as"
		FROM gallery_performers
		WHERE gallery_id = ANY($1::UUID[])
		ORDER BY gallery_id, performer_id`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var item models.GalleryPerformer
		if err := rows.Scan(&item.GalleryID, &item.PerformerID, &item.As); err != nil {
			return nil, err
		}
		appendToPositions(result, positions[item.GalleryID], item)
	}
	return result, rows.Err()
}

func loadUUIDRelations(ctx context.Context, q *queries.Queries, sql string, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	result := make([][]uuid.UUID, len(ids))
	relations, err := loadUUIDRelation(ctx, q, sql, ids)
	if err != nil {
		errs := make([]error, len(ids))
		for i := range errs {
			errs[i] = err
		}
		return result, errs
	}
	return relations, make([]error, len(ids))
}

func loadUUIDRelation(ctx context.Context, q *queries.Queries, sql string, ids []uuid.UUID) ([][]uuid.UUID, error) {
	result := make([][]uuid.UUID, len(ids))
	positions := positionsByUUID(ids)
	if len(ids) == 0 {
		return result, nil
	}
	rows, err := q.DB().Query(ctx, sql, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var parentID, relationID uuid.UUID
		if err := rows.Scan(&parentID, &relationID); err != nil {
			return nil, err
		}
		appendToPositions(result, positions[parentID], relationID)
	}
	return result, rows.Err()
}

func positionsByUUID(ids []uuid.UUID) map[uuid.UUID][]int {
	result := make(map[uuid.UUID][]int, len(ids))
	for i, id := range ids {
		result[id] = append(result[id], i)
	}
	return result
}

func appendToPositions[T any](result [][]T, positions []int, value T) {
	for _, position := range positions {
		result[position] = append(result[position], value)
	}
}
