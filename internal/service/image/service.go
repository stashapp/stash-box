package image

import (
	"bytes"
	"context"
	"database/sql"
	"errors"
	"io"
	"strings"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/image/cache"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
	"github.com/stashapp/stash-box/internal/service/imagetype"
	"github.com/stashapp/stash-box/internal/storage"
)

type Image struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

func NewImage(queries *queries.Queries, withTxn queries.WithTxnFunc) *Image {
	return &Image{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Image) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

func (s *Image) Create(ctx context.Context, input models.ImageCreateInput) (*models.Image, error) {
	// handle image upload
	if input.File != nil {
		if input.File.Size > int64(10*1024*1024) {
			return nil, errors.New("file too big")
		}

		file := make([]byte, input.File.Size)
		if _, err := input.File.File.Read(file); err != nil {
			return nil, err
		}

		return s.storeFile(ctx, file, input.URL, input.Types, input.Date)
	}

	if input.URL == nil {
		return nil, errors.New("missing URL or file")
	}

	id, err := newImageID()
	if err != nil {
		return nil, err
	}

	if err := imagetype.ValidateImageAssignment(ctx, s.queries, id, input.Types, input.Date, nil); err != nil {
		return nil, err
	}

	var dbImage queries.Image
	err = s.withTxn(func(tx *queries.Queries) error {
		var err error
		dbImage, err = tx.CreateImage(ctx, queries.CreateImageParams{
			ID:   id,
			Url:  input.URL,
			Date: input.Date,
		})
		if err != nil {
			return err
		}
		return imagetype.SetImageAssignments(ctx, tx, id, input.Types)
	})
	if err != nil {
		return nil, err
	}

	return converter.ImageToModelPtr(dbImage), nil
}

// newImageID generates a v4 uuid that does not start with "ad", to prevent
// adblock issues, falling back to v7 (still time-ordered, unlike a second v4
// attempt) once the odds of a repeat collision stop mattering.
func newImageID() (uuid.UUID, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return uuid.UUID{}, err
	}

	for strings.HasPrefix(id.String(), "ad") {
		id, err = uuid.NewV7()
		if err != nil {
			return uuid.UUID{}, err
		}
	}

	return id, nil
}

// storeFile writes uploaded bytes as a new image, deduplicating by
// checksum. A checksum match means this is not actually a new image: its
// existing categorization is left untouched rather than overwritten by what
// this write asked for.
func (s *Image) storeFile(ctx context.Context, file []byte, url *string, types []models.ImageTypeEnum, date *string) (*models.Image, error) {
	fileReader := bytes.NewReader(file)

	checksum, err := calculateChecksum(fileReader)
	if err != nil {
		return nil, err
	}

	existing, err := s.FindByChecksum(ctx, checksum)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}

	id, err := newImageID()
	if err != nil {
		return nil, err
	}
	newImage := models.Image{ID: id, Checksum: checksum, RemoteURL: url, Date: date}

	if _, err = fileReader.Seek(0, 0); err != nil {
		return nil, err
	}

	if err := populateImageDimensions(fileReader, &newImage); err != nil {
		return nil, err
	}

	if err := storage.Image().WriteFile(file, &newImage); err != nil {
		return nil, err
	}

	if err := imagetype.ValidateImageAssignment(ctx, s.queries, newImage.ID, types, date, nil); err != nil {
		return nil, err
	}

	var dbImage queries.Image
	err = s.withTxn(func(tx *queries.Queries) error {
		var err error
		dbImage, err = tx.CreateImage(ctx, queries.CreateImageParams{
			ID:       newImage.ID,
			Checksum: newImage.Checksum,
			Width:    newImage.Width,
			Height:   newImage.Height,
			Url:      newImage.RemoteURL,
			Date:     newImage.Date,
		})
		if err != nil {
			return err
		}
		return imagetype.SetImageAssignments(ctx, tx, newImage.ID, types)
	})
	if err != nil {
		return nil, err
	}

	return converter.ImageToModelPtr(dbImage), nil
}

// Update sets an image's url, labels and date. Changing an image that
// already carries labels or a date requires MODERATE; adding categorization
// to one that has none yet stays at EDIT, enforced here against the image's
// current state rather than in the schema directive.
func (s *Image) Update(ctx context.Context, input models.ImageUpdateInput) (*models.Image, error) {
	existing, err := s.Find(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("image not found")
	}

	assigned, err := imagetype.ImageAssignedTypes(ctx, s.queries, input.ID)
	if err != nil {
		return nil, err
	}

	// Types and date are gated independently: restating a field's current
	// value unchanged is not a change, so touching one never requires
	// MODERATE for the other.
	if !sameTypeSet(assigned, input.Types) && len(assigned) > 0 {
		if err := auth.ValidateRole(ctx, models.RoleEnumModerate); err != nil {
			return nil, err
		}
	}
	if !equalStringPtr(existing.Date, input.Date) && existing.Date != nil {
		if err := auth.ValidateRole(ctx, models.RoleEnumModerate); err != nil {
			return nil, err
		}
	}

	if err := imagetype.ValidateImageAssignment(ctx, s.queries, input.ID, input.Types, input.Date, assigned); err != nil {
		return nil, err
	}

	url := existing.RemoteURL
	if input.URL != nil {
		url = input.URL
	}

	var dbImage queries.Image
	err = s.withTxn(func(tx *queries.Queries) error {
		var err error
		dbImage, err = tx.UpdateImage(ctx, queries.UpdateImageParams{
			ID:   input.ID,
			Url:  url,
			Date: input.Date,
		})
		if err != nil {
			return err
		}
		return imagetype.SetImageAssignments(ctx, tx, input.ID, input.Types)
	})
	if err != nil {
		return nil, err
	}

	return converter.ImageToModelPtr(dbImage), nil
}

func (s *Image) Destroy(ctx context.Context, id uuid.UUID) error {
	image, err := s.Find(ctx, id)
	if err != nil {
		return err
	}

	if err := s.queries.DeleteImage(ctx, id); err != nil {
		return err
	}

	// delete the file. Suppress any error
	_ = storage.Image().DestroyFile(image)

	// Clear image from cache
	cacheManager := cache.GetCacheManager()
	if cacheManager != nil {
		_ = cacheManager.Delete(id)
	}

	return nil
}

func (s *Image) Find(ctx context.Context, id uuid.UUID) (*models.Image, error) {
	dbImage, err := s.queries.FindImage(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return converter.ImageToModelPtr(dbImage), nil
}

func (s *Image) FindBySceneID(ctx context.Context, sceneID uuid.UUID) ([]models.Image, error) {
	dbImages, err := s.queries.FindImagesBySceneID(ctx, sceneID)
	if err != nil {
		return nil, err
	}
	return converter.ImagesToModels(dbImages), nil
}

func (s *Image) FindByChecksum(ctx context.Context, checksum string) (*models.Image, error) {
	dbImage, err := s.queries.FindImageByChecksum(ctx, checksum)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return converter.ImageToModelPtr(dbImage), nil
}

func (s *Image) DestroyUnusedImages(ctx context.Context) error {

	unused, err := s.FindUnused(ctx)
	if err != nil {
		return err
	}

	cacheManager := cache.GetCacheManager()

	for len(unused) > 0 {
		for _, i := range unused {
			err = s.Destroy(ctx, i.ID)
			if err != nil {
				return err
			}
			// Clear image from cache
			if cacheManager != nil {
				_ = cacheManager.Delete(i.ID)
			}
		}

		unused, err = s.FindUnused(ctx)
		if err != nil {
			return err
		}
	}

	return nil

}

func (s *Image) DestroyUnusedImage(ctx context.Context, imageID uuid.UUID) error {
	unused, err := s.IsUnused(ctx, imageID)
	if err != nil {
		return err
	}

	if unused {
		err = s.Destroy(ctx, imageID)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Image) FindUnused(ctx context.Context) ([]models.Image, error) {
	dbImages, err := s.queries.FindUnusedImages(ctx)
	if err != nil {
		return nil, err
	}
	return converter.ImagesToModels(dbImages), nil
}

func (s *Image) IsUnused(ctx context.Context, imageID uuid.UUID) (bool, error) {
	return s.queries.IsImageUnused(ctx, imageID)
}

// Dataloader for images by ids
func (s *Image) LoadIds(ctx context.Context, ids []uuid.UUID) ([]*models.Image, []error) {
	dbImages, err := s.queries.FindImagesByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*models.Image)
	for _, dbImage := range dbImages {
		m[dbImage.ID] = converter.ImageToModelPtr(dbImage)
	}

	result := make([]*models.Image, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

// Dataloder for images for scenes
func (s *Image) LoadBySceneIds(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	sceneImages, err := s.queries.FindImageIdsBySceneIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]uuid.UUID)
	for _, sceneImage := range sceneImages {
		m[sceneImage.SceneID] = append(m[sceneImage.SceneID], sceneImage.ImageID)
	}

	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

// Dataloder for images for performers
func (s *Image) LoadByPerformerIds(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	performerImages, err := s.queries.FindImageIdsByPerformerIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]uuid.UUID)
	for _, performerImage := range performerImages {
		m[performerImage.PerformerID] = append(m[performerImage.PerformerID], performerImage.ImageID)
	}

	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (s *Image) FindByPerformerID(ctx context.Context, performerID uuid.UUID) ([]models.Image, error) {
	dbImages, err := s.queries.GetPerformerImages(ctx, performerID)
	if err != nil {
		return nil, err
	}
	return converter.ImagesToModels(dbImages), nil
}

func (s *Image) FindByStudioID(ctx context.Context, studioID uuid.UUID) ([]models.Image, error) {
	dbImages, err := s.queries.FindImagesByStudioID(ctx, studioID)
	if err != nil {
		return nil, err
	}
	return converter.ImagesToModels(dbImages), nil
}

func (s *Image) LoadByStudioIds(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	studioImages, err := s.queries.FindImageIdsByStudioIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]uuid.UUID)
	for _, studioImage := range studioImages {
		m[studioImage.StudioID] = append(m[studioImage.StudioID], studioImage.ImageID)
	}

	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (s *Image) Read(image models.Image) (io.ReadCloser, int64, error) {
	return storage.Image().ReadFile(image)
}

// sameTypeSet compares by set, not sequence: reordering isn't a change.
func sameTypeSet(assigned map[models.ImageTypeEnum]struct{}, submitted []models.ImageTypeEnum) bool {
	if len(assigned) != len(submitted) {
		return false
	}
	for _, t := range submitted {
		if _, ok := assigned[t]; !ok {
			return false
		}
	}
	return true
}

func equalStringPtr(a, b *string) bool {
	if a == nil || b == nil {
		return a == b
	}
	return *a == *b
}
