package gallery

import (
	"context"
	"fmt"
	"sort"
	"strconv"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
)

func (s *Gallery) SetImages(ctx context.Context, galleryID uuid.UUID, images []models.GalleryImageInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return setImages(ctx, tx, galleryID, images)
	})
}

func (s *Gallery) CreateImage(ctx context.Context, galleryID uuid.UUID, input models.GalleryImageInput) (*models.GalleryImage, error) {
	var image models.GalleryImage
	err := s.withTxn(func(tx *queries.Queries) error {
		created, err := createImage(ctx, tx, galleryID, input, 0)
		if err != nil {
			return err
		}

		image = created
		return nil
	})
	return &image, err
}

func (s *Gallery) HasPHash(ctx context.Context, galleryID uuid.UUID, hash models.FingerprintHash) (bool, error) {
	var exists bool
	err := s.queries.DB().QueryRow(ctx,
		"SELECT EXISTS (SELECT 1 FROM gallery_images WHERE gallery_id = $1 AND phash = $2)",
		galleryID, hash.Int64()).Scan(&exists)
	return exists, err
}

func (s *Gallery) UpdateImage(ctx context.Context, imageID uuid.UUID, input models.GalleryImageInput) (*models.GalleryImage, error) {
	var image models.GalleryImage
	err := s.withTxn(func(tx *queries.Queries) error {
		var galleryID uuid.UUID
		var oldIndex int
		if err := tx.DB().QueryRow(ctx,
			`SELECT gallery_id, "index" FROM gallery_images WHERE id = $1 FOR UPDATE`, imageID).
			Scan(&galleryID, &oldIndex); err != nil {
			return err
		}
		if _, err := tx.DB().Exec(ctx, `
			UPDATE gallery_images
			SET phash = $2, updated_at = NOW()
			WHERE id = $1`,
			imageID, input.PHash.Int64()); err != nil {
			return err
		}
		if err := setImageTags(ctx, tx, imageID, input.Tags); err != nil {
			return err
		}
		if input.Index > 0 && input.Index != oldIndex {
			if err := moveImage(ctx, tx, imageID, galleryID, input.Index); err != nil {
				return err
			}
		}
		loaded, err := findImage(ctx, tx, imageID)
		if err != nil {
			return err
		}
		image = loaded
		return nil
	})
	return &image, err
}

func (s *Gallery) FindImage(ctx context.Context, imageID uuid.UUID) (*models.GalleryImage, error) {
	image, err := findImage(ctx, s.queries, imageID)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return &image, nil
}

func (s *Gallery) FindImageByGalleryIndex(ctx context.Context, galleryID uuid.UUID, index int) (*models.GalleryImage, error) {
	if index < 1 {
		return nil, fmt.Errorf("gallery image index must be positive")
	}

	image, err := scanGalleryImage(s.queries.DB().QueryRow(ctx,
		`SELECT `+galleryImageColumns+` FROM gallery_images WHERE gallery_id = $1 AND "index" = $2`,
		galleryID, index))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	image.Tags, err = loadImageTags(ctx, s.queries, image.ID)
	return &image, err
}

func (s *Gallery) FindImageByPHash(ctx context.Context, galleryID uuid.UUID, hash models.FingerprintHash) (*models.GalleryImage, error) {
	image, err := scanGalleryImage(s.queries.DB().QueryRow(ctx,
		`SELECT `+galleryImageColumns+` FROM gallery_images WHERE gallery_id = $1 AND phash = $2`,
		galleryID, hash.Int64()))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	image.Tags, err = loadImageTags(ctx, s.queries, image.ID)
	return &image, err
}

func (s *Gallery) GetImages(ctx context.Context, galleryID uuid.UUID) ([]models.GalleryImage, error) {
	images, err := loadImages(ctx, s.queries, []uuid.UUID{galleryID})
	if err != nil {
		return nil, err
	}
	return images[0], nil
}

func (s *Gallery) CountImages(ctx context.Context, galleryID uuid.UUID) (int, error) {
	return s.queries.CountGalleryImages(ctx, galleryID)
}

func (s *Gallery) LoadImages(ctx context.Context, ids []uuid.UUID) ([][]models.GalleryImage, []error) {
	result := make([][]models.GalleryImage, len(ids))
	images, err := loadImages(ctx, s.queries, ids)
	if err != nil {
		errs := make([]error, len(ids))
		for i := range errs {
			errs[i] = err
		}
		return result, errs
	}
	return images, make([]error, len(ids))
}

func (s *Gallery) DeleteImage(ctx context.Context, imageID uuid.UUID) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return deleteImage(ctx, tx, imageID)
	})
}

func (s *Gallery) MoveImage(ctx context.Context, imageID uuid.UUID, index int) error {
	return s.withTxn(func(tx *queries.Queries) error {
		var galleryID uuid.UUID
		if err := tx.DB().QueryRow(ctx,
			"SELECT gallery_id FROM gallery_images WHERE id = $1 FOR UPDATE", imageID).Scan(&galleryID); err != nil {
			return err
		}
		return moveImage(ctx, tx, imageID, galleryID, index)
	})
}

func (s *Gallery) SetImageTags(ctx context.Context, imageID uuid.UUID, tags []models.GalleryImageTagInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return setImageTags(ctx, tx, imageID, tags)
	})
}

func (s *Gallery) ReplaceImagePHash(ctx context.Context, imageID uuid.UUID, hash models.FingerprintHash) (*models.GalleryImage, error) {
	var image models.GalleryImage
	err := s.withTxn(func(tx *queries.Queries) error {
		updated, err := replaceImagePHash(ctx, tx, imageID, hash)
		if err == nil {
			image = updated
		}
		return err
	})
	return &image, err
}

// DeleteImagePHash removes the metadata row whose pHash matches. A gallery
// image always has exactly one pHash, so deleting the hash necessarily deletes
// the row and then closes the index gap.
func (s *Gallery) DeleteImagePHash(ctx context.Context, imageID uuid.UUID, hash models.FingerprintHash) error {
	return s.withTxn(func(tx *queries.Queries) error {
		var galleryID uuid.UUID
		err := tx.DB().QueryRow(ctx,
			"SELECT gallery_id FROM gallery_images WHERE id = $1 AND phash = $2 FOR UPDATE",
			imageID, hash.Int64()).Scan(&galleryID)
		if err != nil {
			return err
		}
		tag, err := tx.DB().Exec(ctx, "DELETE FROM gallery_images WHERE id = $1 AND phash = $2", imageID, hash.Int64())
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return pgx.ErrNoRows
		}
		return reindexImages(ctx, tx, galleryID)
	})
}

// FindByPHash accepts normalized signed 64-bit hashes and applies the same
// configured exact-or-distance policy used by scene fingerprints.
func (s *Gallery) FindByPHash(ctx context.Context, hashes []models.FingerprintHash, minimumMatches int) ([]models.GalleryPHashMatch, error) {
	if minimumMatches < 1 {
		return nil, fmt.Errorf("minimum gallery pHash match count must be at least 1")
	}
	uniqueHashes := deduplicateHashes(hashes)
	if len(uniqueHashes) == 0 {
		return []models.GalleryPHashMatch{}, nil
	}

	// The bktree custom scan supports batches of at most 64 targets.
	const batchSize = 64
	matchedImages := make(map[uuid.UUID]map[uuid.UUID]struct{})
	distance := config.GetPHashDistance()
	for start := 0; start < len(uniqueHashes); start += batchSize {
		end := min(start+batchSize, len(uniqueHashes))
		var rows pgx.Rows
		var err error
		if distance > 0 {
			rows, err = s.queries.DB().Query(ctx, `
				SELECT DISTINCT GI.gallery_id, GI.id
				FROM UNNEST($1::BIGINT[]) PH(phash)
				JOIN gallery_images GI ON GI.phash <@ (PH.phash, $2::INTEGER)
				JOIN galleries G ON G.id = GI.gallery_id AND G.deleted = FALSE`,
				uniqueHashes[start:end], distance)
		} else {
			rows, err = s.queries.DB().Query(ctx, `
				SELECT GI.gallery_id, GI.id
				FROM gallery_images GI
				JOIN galleries G ON G.id = GI.gallery_id AND G.deleted = FALSE
				WHERE GI.phash = ANY($1::BIGINT[])`,
				uniqueHashes[start:end])
		}
		if err != nil {
			return nil, err
		}
		for rows.Next() {
			var galleryID, imageID uuid.UUID
			if err := rows.Scan(&galleryID, &imageID); err != nil {
				rows.Close()
				return nil, err
			}
			if matchedImages[galleryID] == nil {
				matchedImages[galleryID] = make(map[uuid.UUID]struct{})
			}
			matchedImages[galleryID][imageID] = struct{}{}
		}
		if err := rows.Err(); err != nil {
			rows.Close()
			return nil, err
		}
		rows.Close()
	}

	galleryIDs := make([]uuid.UUID, 0, len(matchedImages))
	for galleryID, images := range matchedImages {
		if len(images) >= minimumMatches {
			galleryIDs = append(galleryIDs, galleryID)
		}
	}
	galleries, err := findGalleriesByIDs(ctx, s.queries, galleryIDs, false)
	if err != nil {
		return nil, err
	}
	result := make([]models.GalleryPHashMatch, 0, len(galleries))
	for _, gallery := range galleries {
		result = append(result, models.GalleryPHashMatch{
			Gallery: gallery,
			Count:   len(matchedImages[gallery.ID]),
		})
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].Count != result[j].Count {
			return result[i].Count > result[j].Count
		}
		return result[i].Gallery.ID.String() < result[j].Gallery.ID.String()
	})
	return result, nil
}

const galleryImageColumns = `id, gallery_id, "index", phash, created_at, updated_at`

func setImages(ctx context.Context, q *queries.Queries, galleryID uuid.UUID, images []models.GalleryImageInput) error {
	if err := models.ValidateGalleryImages(
		images,
		func(image models.GalleryImageInput) int { return image.Index },
		func(image models.GalleryImageInput) models.FingerprintHash { return image.PHash },
	); err != nil {
		return err
	}
	if _, err := q.DB().Exec(ctx, "DELETE FROM gallery_images WHERE gallery_id = $1", galleryID); err != nil {
		return err
	}
	ordered := append([]models.GalleryImageInput(nil), images...)
	sort.SliceStable(ordered, func(i, j int) bool {
		left, right := ordered[i].Index, ordered[j].Index
		if left <= 0 {
			left = int(^uint(0) >> 1)
		}
		if right <= 0 {
			right = int(^uint(0) >> 1)
		}
		return left < right
	})
	for _, input := range ordered {
		if _, err := createImage(ctx, q, galleryID, input, -1); err != nil {
			return err
		}
	}
	return nil
}

func createImage(ctx context.Context, q *queries.Queries, galleryID uuid.UUID, input models.GalleryImageInput, forcedIndex int) (models.GalleryImage, error) {
	index := input.Index
	if forcedIndex == 0 {
		var maximum *int
		if err := q.DB().QueryRow(ctx,
			`SELECT MAX("index") FROM gallery_images WHERE gallery_id = $1`, galleryID).Scan(&maximum); err != nil {
			return models.GalleryImage{}, err
		}
		index = 1
		if maximum != nil {
			index = *maximum + 1
		}
	}
	if forcedIndex == -1 {
		var count int
		if err := q.DB().QueryRow(ctx,
			`SELECT COUNT(*) FROM gallery_images WHERE gallery_id = $1`, galleryID).Scan(&count); err != nil {
			return models.GalleryImage{}, err
		}
		index = count + 1
	}
	if index < 1 {
		index = 1
	}

	id, err := uuid.NewV7()
	if err != nil {
		return models.GalleryImage{}, err
	}
	image, err := scanGalleryImage(q.DB().QueryRow(ctx, `
		INSERT INTO gallery_images
			(id, gallery_id, "index", phash, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING `+galleryImageColumns,
		id, galleryID, index, input.PHash.Int64()))
	if err != nil {
		return models.GalleryImage{}, err
	}
	if err := setImageTags(ctx, q, id, input.Tags); err != nil {
		return models.GalleryImage{}, err
	}
	image.Tags = append([]models.GalleryImageTag(nil), tagModels(input.Tags)...)
	return image, nil
}

func findImage(ctx context.Context, q *queries.Queries, imageID uuid.UUID) (models.GalleryImage, error) {
	image, err := scanGalleryImage(q.DB().QueryRow(ctx,
		"SELECT "+galleryImageColumns+" FROM gallery_images WHERE id = $1", imageID))
	if err != nil {
		return models.GalleryImage{}, err
	}
	tags, err := loadImageTags(ctx, q, imageID)
	image.Tags = tags
	return image, err
}

func loadImages(ctx context.Context, q *queries.Queries, ids []uuid.UUID) ([][]models.GalleryImage, error) {
	result := make([][]models.GalleryImage, len(ids))
	positions := positionsByUUID(ids)
	if len(ids) == 0 {
		return result, nil
	}
	rows, err := q.DB().Query(ctx, `
		SELECT id, gallery_id, "index", phash, created_at, updated_at
		FROM gallery_images
		WHERE gallery_id = ANY($1::UUID[])
		ORDER BY gallery_id, "index"`, ids)
	if err != nil {
		return nil, err
	}
	imagesByHiddenID := make(map[uuid.UUID][]int)
	var rowImages []models.GalleryImage
	for rows.Next() {
		image, err := scanGalleryImage(rows)
		if err != nil {
			rows.Close()
			return nil, err
		}
		rowImages = append(rowImages, image)
		base := len(rowImages) - 1
		imagesByHiddenID[image.ID] = append(imagesByHiddenID[image.ID], base)
		appendToPositions(result, positions[image.GalleryID], image)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, err
	}
	rows.Close()

	if len(rowImages) == 0 {
		return result, nil
	}
	hiddenIDs := make([]uuid.UUID, len(rowImages))
	for i := range rowImages {
		hiddenIDs[i] = rowImages[i].ID
	}
	tagRows, err := q.DB().Query(ctx, `
		SELECT gallery_image_id, tag_id
		FROM gallery_image_tags
		WHERE gallery_image_id = ANY($1::UUID[])
		ORDER BY gallery_image_id, tag_id`, hiddenIDs)
	if err != nil {
		return nil, err
	}
	defer tagRows.Close()
	for tagRows.Next() {
		var imageID uuid.UUID
		var tag models.GalleryImageTag
		if err := tagRows.Scan(&imageID, &tag.TagID); err != nil {
			return nil, err
		}
		for _, rowImageIndex := range imagesByHiddenID[imageID] {
			rowImages[rowImageIndex].Tags = append(rowImages[rowImageIndex].Tags, tag)
		}
		for _, galleryPosition := range positions[rowImages[imagesByHiddenID[imageID][0]].GalleryID] {
			for i := range result[galleryPosition] {
				if result[galleryPosition][i].ID == imageID {
					result[galleryPosition][i].Tags = append(result[galleryPosition][i].Tags, tag)
				}
			}
		}
	}
	return result, tagRows.Err()
}

func setImageTags(ctx context.Context, q *queries.Queries, imageID uuid.UUID, tags []models.GalleryImageTagInput) error {
	for _, tag := range tags {
		if tag.TagID == nil {
			return fmt.Errorf("gallery image tags must reference an existing tag")
		}
	}
	if _, err := q.DB().Exec(ctx, "DELETE FROM gallery_image_tags WHERE gallery_image_id = $1", imageID); err != nil {
		return err
	}
	for _, tag := range tags {
		if _, err := q.DB().Exec(ctx, `
			INSERT INTO gallery_image_tags (gallery_image_id, tag_id)
			VALUES ($1, $2)`, imageID, tag.TagID); err != nil {
			return err
		}
	}
	return nil
}

func loadImageTags(ctx context.Context, q *queries.Queries, imageID uuid.UUID) ([]models.GalleryImageTag, error) {
	rows, err := q.DB().Query(ctx, `
		SELECT tag_id FROM gallery_image_tags
		WHERE gallery_image_id = $1
		ORDER BY tag_id`, imageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []models.GalleryImageTag
	for rows.Next() {
		var tag models.GalleryImageTag
		if err := rows.Scan(&tag.TagID); err != nil {
			return nil, err
		}
		result = append(result, tag)
	}
	return result, rows.Err()
}

func replaceImagePHash(ctx context.Context, q *queries.Queries, imageID uuid.UUID, hash models.FingerprintHash) (models.GalleryImage, error) {
	var exists bool
	if err := q.DB().QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM gallery_images
			WHERE gallery_id = (SELECT gallery_id FROM gallery_images WHERE id = $1)
			  AND id <> $1
			  AND phash = $2
		)`, imageID, hash.Int64()).Scan(&exists); err != nil {
		return models.GalleryImage{}, err
	}
	if exists {
		return models.GalleryImage{}, fmt.Errorf("gallery image pHash %s already exists in this gallery", hash.Hex())
	}
	image, err := scanGalleryImage(q.DB().QueryRow(ctx, `
		UPDATE gallery_images
		SET phash = $2, updated_at = NOW()
		WHERE id = $1
		RETURNING `+galleryImageColumns, imageID, hash.Int64()))
	if err != nil {
		return models.GalleryImage{}, err
	}
	image.Tags, err = loadImageTags(ctx, q, imageID)
	return image, err
}

func deleteImage(ctx context.Context, q *queries.Queries, imageID uuid.UUID) error {
	var galleryID uuid.UUID
	if err := q.DB().QueryRow(ctx,
		"SELECT gallery_id FROM gallery_images WHERE id = $1 FOR UPDATE", imageID).Scan(&galleryID); err != nil {
		return err
	}
	tag, err := q.DB().Exec(ctx, "DELETE FROM gallery_images WHERE id = $1", imageID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return reindexImages(ctx, q, galleryID)
}

func moveImage(ctx context.Context, q *queries.Queries, imageID, galleryID uuid.UUID, newIndex int) error {
	rows, err := q.DB().Query(ctx, `
		SELECT id
		FROM gallery_images
		WHERE gallery_id = $1
		ORDER BY "index", id
		FOR UPDATE`, galleryID)
	if err != nil {
		return err
	}
	var ordered []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		ordered = append(ordered, id)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	oldPosition := -1
	for i, id := range ordered {
		if id == imageID {
			oldPosition = i
			break
		}
	}
	if oldPosition == -1 {
		return pgx.ErrNoRows
	}
	if newIndex < 1 || newIndex > len(ordered) {
		return fmt.Errorf("gallery image index must be between 1 and %d", len(ordered))
	}
	newPosition := newIndex - 1
	ordered = append(ordered[:oldPosition], ordered[oldPosition+1:]...)
	ordered = append(ordered, uuid.Nil)
	copy(ordered[newPosition+1:], ordered[newPosition:])
	ordered[newPosition] = imageID

	if _, err := q.DB().Exec(ctx, `
		UPDATE gallery_images SET "index" = "index" + $2, updated_at = NOW()
		WHERE gallery_id = $1`, galleryID, len(ordered)+1); err != nil {
		return err
	}
	for i, id := range ordered {
		if _, err := q.DB().Exec(ctx,
			`UPDATE gallery_images SET "index" = $2, updated_at = NOW() WHERE id = $1`, id, i+1); err != nil {
			return err
		}
	}
	return nil
}

func reindexImages(ctx context.Context, q *queries.Queries, galleryID uuid.UUID) error {
	_, err := q.DB().Exec(ctx, `
		WITH ordered AS (
		  SELECT id, ROW_NUMBER() OVER (ORDER BY "index", id)::INTEGER AS new_index
		  FROM gallery_images
		  WHERE gallery_id = $1
		)
		UPDATE gallery_images GI
		SET "index" = ordered.new_index, updated_at = NOW()
		FROM ordered
		WHERE GI.id = ordered.id AND GI."index" <> ordered.new_index`, galleryID)
	return err
}

func scanGalleryImage(row pgx.Row) (models.GalleryImage, error) {
	var image models.GalleryImage
	err := row.Scan(
		&image.ID,
		&image.GalleryID,
		&image.Index,
		&image.PHash,
		&image.CreatedAt,
		&image.UpdatedAt,
	)
	return image, err
}

func tagModels(tags []models.GalleryImageTagInput) []models.GalleryImageTag {
	result := make([]models.GalleryImageTag, 0, len(tags))
	for _, tag := range tags {
		result = append(result, models.GalleryImageTag{TagID: tag.TagID})
	}
	return result
}

func deduplicateHashes(hashes []models.FingerprintHash) []int64 {
	seen := make(map[int64]struct{}, len(hashes))
	result := make([]int64, 0, len(hashes))
	for _, hash := range hashes {
		value := hash.Int64()
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

func parsePHashHex(value string) (models.FingerprintHash, error) {
	if len(value) != 16 {
		return 0, fmt.Errorf("gallery image phash must be exactly 16 hexadecimal characters")
	}
	parsed, err := strconv.ParseUint(value, 16, 64)
	if err != nil {
		return 0, fmt.Errorf("gallery image phash is not hexadecimal: %w", err)
	}
	return models.FingerprintHash(int64(parsed)), nil
}
