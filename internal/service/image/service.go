package image

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"strings"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/image/cache"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/imagetype"
	"github.com/stashapp/stash-box/internal/service/loadutil"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	"github.com/stashapp/stash-box/internal/storage"
)

var errOrganized = errors.New("image is organized; withdraw the mark before changing it")

const maxUploadBytes = int64(10 * 1024 * 1024)

var errUploadTooBig = errors.New("file too big")

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
		if input.File.Size > maxUploadBytes {
			return nil, errUploadTooBig
		}

		// ReadFull rather than Read: a single Read may return early on a
		// multipart upload, and a short read here yields a truncated image
		// that still decodes and then gets cropped and stored as the master
		file := make([]byte, input.File.Size)
		if _, err := io.ReadFull(input.File.File, file); err != nil {
			return nil, err
		}

		// Before the checksum, so everything downstream (like deduplication, dimensions,
		// and what gets written) is about the image that will actually exist
		if input.Crop != nil {
			cropped, changed, err := cropUpload(file, *input.Crop)
			if err != nil {
				return nil, err
			}
			// Checked again on the way out: the limit is about what gets
			// stored, and re-encoding is not guaranteed to shrink what it was
			// given. Straightening a flat PNG can grow it outright!
			if int64(len(cropped)) > maxUploadBytes {
				return nil, errUploadTooBig
			}

			// An identity crop keeps the whole upload
			if !changed {
				return s.storeFile(ctx, cropped, input.URL, input.Types, input.Date, nil, uuid.NullUUID{}, nil)
			}

			original, err := s.storeFile(ctx, file, nil, nil, nil, nil, uuid.NullUUID{}, nil)
			if err != nil {
				return nil, err
			}

			// Flat even when the upload's bytes turn out to be an existing crop:
			// link to that crop's own original, or Recrop would frame from the narrower intermediate
			rootID := original.ID
			if original.OriginalImageID.Valid {
				rootID = original.OriginalImageID.UUID
			}
			return s.storeFile(ctx, cropped, input.URL, input.Types, input.Date, nil, uuid.NullUUID{UUID: rootID, Valid: true}, nil)
		}

		return s.storeFile(ctx, file, input.URL, input.Types, input.Date, nil, uuid.NullUUID{}, nil)
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
			ID:            id,
			Url:           input.URL,
			Date:          input.Date,
			CategorizedAt: categorizationTime(input.Types, input.Date),
			CategorizedBy: categorizationActor(ctx, input.Types, input.Date),
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

func categorizationTime(types []models.ImageTypeEnum, date *string) *time.Time {
	if len(types) == 0 && date == nil {
		return nil
	}
	now := time.Now()
	return &now
}

// categorizationActor pairs with categorizationTime: who last set the
// categorization, NULL when there is none. Unlike the audit trail this
// survives retention pruning so the review feed always has someone to name
func categorizationActor(ctx context.Context, types []models.ImageTypeEnum, date *string) uuid.NullUUID {
	if len(types) == 0 && date == nil {
		return uuid.NullUUID{}
	}
	if currentUser := auth.GetCurrentUser(ctx); currentUser != nil {
		return uuid.NullUUID{UUID: currentUser.ID, Valid: true}
	}
	return uuid.NullUUID{}
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

// storeFile writes image bytes as a new image, deduplicating by checksum.
// Shared by Create's upload path (cropped or not), its retained-original
// write, and Recrop. A checksum match means this is not actually a new
// image: its existing categorization is left untouched rather than
// overwritten by what this write asked for. Created reports which of the
// two happened, so a caller recording consequences of the write (Recrop's
// audit row) can stay silent about writes that never occurred
//
// assigned is what the image these bytes derive from already carried, so a
// recrop can restate a label that has since been disabled without being
// rejected, the same grandfathering Update applies; nil for a fresh upload
//
// then, if given, runs inside the transaction that creates the row, with the
// new row's id, and only when a row is actually created: a checksum hit
// returns the existing row untouched and nothing else happens. That is where
// bookkeeping about the creation belongs, so a crash between two commits can
// never leave the row without it
func (s *Image) storeFile(ctx context.Context, file []byte, url *string, types []models.ImageTypeEnum, date *string, assigned imagetype.AssignedTypes, originalImageID uuid.NullUUID, then func(tx *queries.Queries, id uuid.UUID) error) (*models.Image, error) {
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

	// Validated before the file is written, not after: a rejected label
	// combination must not leave an orphaned file in storage that no row ever points at
	if err := imagetype.ValidateImageAssignment(ctx, s.queries, newImage.ID, types, date, assigned); err != nil {
		return nil, err
	}

	if _, err = fileReader.Seek(0, 0); err != nil {
		return nil, err
	}

	if err := populateImageDimensions(fileReader, &newImage); err != nil {
		return nil, err
	}

	if err := storage.Image().WriteFile(file, &newImage); err != nil {
		return nil, err
	}

	var dbImage queries.Image
	err = s.withTxn(func(tx *queries.Queries) error {
		var err error
		dbImage, err = tx.CreateImage(ctx, queries.CreateImageParams{
			ID:              newImage.ID,
			Checksum:        newImage.Checksum,
			Width:           newImage.Width,
			Height:          newImage.Height,
			Url:             newImage.RemoteURL,
			Date:            newImage.Date,
			CategorizedAt:   categorizationTime(types, date),
			CategorizedBy:   categorizationActor(ctx, types, date),
			OriginalImageID: originalImageID,
		})
		if err != nil {
			return err
		}
		if err := imagetype.SetImageAssignments(ctx, tx, newImage.ID, types); err != nil {
			return err
		}
		if then != nil {
			return then(tx, newImage.ID)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return converter.ImageToModelPtr(dbImage), nil
}

// Update sets an image's url, labels and date. Anyone with EDIT may set and
// freely revise both until a moderator marks the image organized; from then
// on the categorization is final for everyone, moderators included!
// Restating a field's current value unchanged is not a change and never gates
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

	typesChanged := !sameTypeSet(assigned, input.Types)
	dateChanged := !equalStringPtr(existing.Date, input.Date)
	if (typesChanged || dateChanged) && existing.Organized {
		return nil, errOrganized
	}

	if err := imagetype.ValidateImageAssignment(ctx, s.queries, input.ID, input.Types, input.Date, assigned); err != nil {
		return nil, err
	}

	url := existing.RemoteURL
	if input.URL != nil {
		url = input.URL
	}

	categorizedAt := existing.CategorizedAt
	categorizedBy := existing.CategorizedBy
	if typesChanged || dateChanged {
		categorizedAt = categorizationTime(input.Types, input.Date)
		categorizedBy = categorizationActor(ctx, input.Types, input.Date)
	}

	previousTypes := typeSetSlice(assigned)

	var dbImage queries.Image
	err = s.withTxn(func(tx *queries.Queries) error {
		var err error
		dbImage, err = tx.UpdateImage(ctx, queries.UpdateImageParams{
			ID:            input.ID,
			Url:           url,
			Date:          input.Date,
			CategorizedAt: categorizedAt,
			CategorizedBy: categorizedBy,
		})
		if err != nil {
			return err
		}
		if typesChanged {
			if err := imagetype.SetImageAssignments(ctx, tx, input.ID, input.Types); err != nil {
				return err
			}
		}
		if typesChanged || dateChanged {
			return writeImageAudit(ctx, tx, auditCategorize, input.ID, imageAuditData{
				TypesBefore: previousTypes,
				TypesAfter:  input.Types,
				DateBefore:  existing.Date,
				DateAfter:   input.Date,
			})
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return converter.ImageToModelPtr(dbImage), nil
}

// SetOrganized flips the moderator sign-off on an image's categorization.
// The MODERATE requirement is enforced by the schema directive; this is the
// only way the flag changes, so the audit row here is its complete history
func (s *Image) SetOrganized(ctx context.Context, input models.ImageSetOrganizedInput) (*models.Image, error) {
	existing, err := s.Find(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("image not found")
	}
	if existing.Organized == input.Organized {
		// Idempotent restatement: no row rewrite, nothing worth recording
		return existing, nil
	}

	var dbImage queries.Image
	err = s.withTxn(func(tx *queries.Queries) error {
		var err error
		dbImage, err = tx.SetImageOrganized(ctx, queries.SetImageOrganizedParams{
			ID:        input.ID,
			Organized: input.Organized,
		})
		if err != nil {
			return err
		}
		return writeImageAudit(ctx, tx, auditOrganize, input.ID, imageAuditData{
			OrganizedBefore: &existing.Organized,
			OrganizedAfter:  &input.Organized,
		})
	})
	if err != nil {
		return nil, err
	}

	return converter.ImageToModelPtr(dbImage), nil
}

// RevertCategorization restores an image's labels and date to what they were
// before the most recent change, read back from the audit log's "before"
// payload. Without a surviving audit row (it could have aged out) there is
// no recorded prior state and the categorization is cleared instead; either way
// the image is out of the last categorizer's hands
func (s *Image) RevertCategorization(ctx context.Context, input models.ImageRevertCategorizationInput) (*models.Image, error) {
	var types []models.ImageTypeEnum
	var date *string
	action := auditCategorize
	trail, err := s.queries.GetImageAudits(ctx, queries.GetImageAuditsParams{
		ImageID: input.ID,
		Action:  &action,
	})
	if err != nil {
		return nil, err
	}
	if len(trail) > 0 {
		var data imageAuditData
		if err := json.Unmarshal(trail[0].Data, &data); err != nil {
			return nil, err
		}
		types = data.TypesBefore
		date = data.DateBefore
	}

	return s.Update(ctx, models.ImageUpdateInput{
		ID:    input.ID,
		Types: types,
		Date:  date,
	})
}

type imageAuditData struct {
	TypesBefore     []models.ImageTypeEnum `json:"types_before,omitempty"`
	TypesAfter      []models.ImageTypeEnum `json:"types_after,omitempty"`
	DateBefore      *string                `json:"date_before,omitempty"`
	DateAfter       *string                `json:"date_after,omitempty"`
	OrganizedBefore *bool                  `json:"organized_before,omitempty"`
	OrganizedAfter  *bool                  `json:"organized_after,omitempty"`
}

// The two image_audit actions. Plain strings against the table's CHECK
// constraint rather than a generated enum: two values, one writer
const (
	auditCategorize = "CATEGORIZE"
	auditOrganize   = "ORGANIZE"
)

// writeImageAudit records an image change in image_audit, in the caller's
// transaction so the record and the change land or fail together. Label and
// date changes bypass the edit queue, so this is their only paper trail
func writeImageAudit(ctx context.Context, tx *queries.Queries, action string, imageID uuid.UUID, data imageAuditData) error {
	if config.GetImageAuditRetentionDays() <= 0 {
		return nil
	}

	currentUser := auth.GetCurrentUser(ctx)
	var userID uuid.NullUUID
	if currentUser != nil {
		userID = uuid.NullUUID{UUID: currentUser.ID, Valid: true}
	}

	payload, err := json.Marshal(data)
	if err != nil {
		return err
	}

	auditID, err := uuid.NewV7()
	if err != nil {
		return err
	}

	_, err = tx.CreateImageAudit(ctx, queries.CreateImageAuditParams{
		ID:      auditID,
		Action:  action,
		UserID:  userID,
		ImageID: imageID,
		Data:    payload,
	})
	return err
}

// AuditTrail is an image's audit rows, newest first: the revert reads its head
func (s *Image) AuditTrail(ctx context.Context, imageID uuid.UUID) ([]queries.ImageAudit, error) {
	return s.queries.GetImageAudits(ctx, queries.GetImageAuditsParams{ImageID: imageID})
}

func (s *Image) DeleteExpiredAudits(ctx context.Context, retentionDays int) error {
	return s.queries.DeleteExpiredImageAudits(ctx, retentionDays)
}

func typeSetSlice(assigned map[models.ImageTypeEnum]struct{}) []models.ImageTypeEnum {
	types := make([]models.ImageTypeEnum, 0, len(assigned))
	for t := range assigned {
		types = append(types, t)
	}
	return types
}

// QueryUnorganized is the moderator review feed: categorized images awaiting a sign-off, newest categorization first
func (s *Image) QueryUnorganized(ctx context.Context, filter models.UnorganizedImagesQueryInput) ([]models.UnorganizedImage, error) {
	p := queryhelper.Pagination(filter.Page, filter.PerPage)

	var performerID, userID uuid.NullUUID
	if filter.PerformerID != nil {
		performerID = uuid.NullUUID{UUID: *filter.PerformerID, Valid: true}
	}
	if filter.UserID != nil {
		userID = uuid.NullUUID{UUID: *filter.UserID, Valid: true}
	}

	rows, err := s.queries.QueryUnorganizedImages(ctx, queries.QueryUnorganizedImagesParams{
		Limit:       p.Limit,
		Offset:      p.Offset,
		PerformerID: performerID,
		UserID:      userID,
	})
	if err != nil {
		return nil, err
	}

	feed := make([]models.UnorganizedImage, len(rows))
	for i, row := range rows {
		image := converter.ImageToModel(row.Image)
		feed[i] = models.UnorganizedImage{
			Image:       &image,
			PerformerID: row.PerformerID,
		}
	}
	return feed, nil
}

func (s *Image) UnorganizedCount(ctx context.Context, filter models.UnorganizedImagesQueryInput) (int, error) {
	var performerID, userID uuid.NullUUID
	if filter.PerformerID != nil {
		performerID = uuid.NullUUID{UUID: *filter.PerformerID, Valid: true}
	}
	if filter.UserID != nil {
		userID = uuid.NullUUID{UUID: *filter.UserID, Valid: true}
	}

	count, err := s.queries.GetUnorganizedImageCount(ctx, queries.GetUnorganizedImageCountParams{
		PerformerID: performerID,
		UserID:      userID,
	})
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

// Recrop cuts a new frame from an image's retained original when one exists,
// falling back to its own stored bytes, and always produces a new row rather
// than mutating the source: a stored image may in principle be shared by
// more than one entity via checksum deduplication
//
// types/date default to the source's current values when omitted; an
// explicit value replaces them on the new row instead, which is what lets
// labelling a never-before-categorized image and cropping it to match stay
// one EDIT-level action. The organized mark does not gate this path: a
// recrop is a new image whose attachment rides the edit queue, and the
// queue is the control there. The derived row starts unorganized either
// way: it is new work and would need its own organized mark
func (s *Image) Recrop(ctx context.Context, input models.ImageRecropInput) (*models.Image, error) {
	source, err := s.Find(ctx, input.ImageID)
	if err != nil {
		return nil, err
	}
	if source == nil {
		return nil, errors.New("image not found")
	}

	assigned, err := imagetype.ImageAssignedTypes(ctx, s.queries, source.ID)
	if err != nil {
		return nil, err
	}

	types := input.Types
	if types == nil {
		types = typeSetSlice(assigned)
	}
	date := input.Date
	if date == nil {
		date = source.Date
	}

	// Resolve the material to crop from before reading bytes: if the source
	// already has a retained original, that is always better material than
	// the source's own (already-cropped) bytes. Chains stay flat by
	// resolving here rather than linking to the source: a second recrop of
	// a recrop still points at the same original a first recrop found,
	// never a chain of narrower and narrower intermediates
	cropTarget := source
	originalImageID := source.OriginalImageID
	if originalImageID.Valid {
		cropTarget, err = s.Find(ctx, originalImageID.UUID)
		if err != nil {
			return nil, err
		}
		if cropTarget == nil {
			return nil, errors.New("original image not found")
		}
	} else {
		originalImageID = uuid.NullUUID{UUID: source.ID, Valid: true}
	}

	reader, _, err := s.Read(*cropTarget)
	if err != nil {
		return nil, err
	}
	defer reader.Close()

	file, err := io.ReadAll(reader)
	if err != nil {
		return nil, err
	}

	cropped, _, err := cropUpload(file, *input.Crop)
	if err != nil {
		return nil, err
	}
	if int64(len(cropped)) > maxUploadBytes {
		return nil, errUploadTooBig
	}

	var audit func(tx *queries.Queries, id uuid.UUID) error
	if !sameTypeSet(assigned, types) || !equalStringPtr(source.Date, date) {
		audit = func(tx *queries.Queries, id uuid.UUID) error {
			return writeImageAudit(ctx, tx, auditCategorize, id, imageAuditData{
				TypesBefore: typeSetSlice(assigned),
				TypesAfter:  types,
				DateBefore:  source.Date,
				DateAfter:   date,
			})
		}
	}

	return s.storeFile(ctx, cropped, nil, types, date, assigned, originalImageID, audit)
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
	return loadutil.One(ids,
		func(ids []uuid.UUID) ([]queries.Image, error) { return s.queries.FindImagesByIds(ctx, ids) },
		func(image queries.Image) uuid.UUID { return image.ID },
		converter.ImageToModelPtr,
	)
}

// Dataloder for images for scenes
func (s *Image) LoadBySceneIds(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	return loadutil.Many(ids,
		func(ids []uuid.UUID) ([]queries.SceneImage, error) { return s.queries.FindImageIdsBySceneIds(ctx, ids) },
		func(image queries.SceneImage) uuid.UUID { return image.SceneID },
		func(image queries.SceneImage) uuid.UUID { return image.ImageID },
	)
}

// Dataloder for images for performers
func (s *Image) LoadByPerformerIds(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	return loadutil.Many(ids,
		func(ids []uuid.UUID) ([]queries.PerformerImage, error) {
			return s.queries.FindImageIdsByPerformerIds(ctx, ids)
		},
		func(image queries.PerformerImage) uuid.UUID { return image.PerformerID },
		func(image queries.PerformerImage) uuid.UUID { return image.ImageID },
	)
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
	return loadutil.Many(ids,
		func(ids []uuid.UUID) ([]queries.StudioImage, error) {
			return s.queries.FindImageIdsByStudioIds(ctx, ids)
		},
		func(image queries.StudioImage) uuid.UUID { return image.StudioID },
		func(image queries.StudioImage) uuid.UUID { return image.ImageID },
	)
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
