package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models/assign"
	"github.com/stashapp/stash-box/internal/models/validator"
)

type Gallery struct {
	ID           uuid.UUID     `json:"id"`
	Title        *string       `json:"title,omitempty"`
	Code         *string       `json:"code,omitempty"`
	Date         *string       `json:"date,omitempty"`
	Photographer *string       `json:"photographer,omitempty"`
	Details      *string       `json:"details,omitempty"`
	StudioID     uuid.NullUUID `json:"studio_id"`
	CoverImageID uuid.NullUUID `json:"cover_image_id"`
	Deleted      bool          `json:"deleted"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

func (g *Gallery) IsEditTarget() {}

func (g *Gallery) CopyFromGalleryEdit(input GalleryEdit, old *GalleryEdit) {
	assign.StringPtr(&g.Title, input.Title, old.Title)
	assign.StringPtr(&g.Code, input.Code, old.Code)
	assign.StringPtr(&g.Date, input.Date, old.Date)
	assign.StringPtr(&g.Photographer, input.Photographer, old.Photographer)
	assign.StringPtr(&g.Details, input.Details, old.Details)
	assign.NullUUID(&g.StudioID, input.StudioID, old.StudioID)
	assign.NullUUID(&g.CoverImageID, input.CoverImageID, old.CoverImageID)
}

func (g *Gallery) ValidateModifyEdit(edit GalleryEditData) error {
	checks := []error{
		validator.StringPtr("Title", edit.Old.Title, g.Title),
		validator.StringPtr("Code", edit.Old.Code, g.Code),
		validator.StringPtr("Date", edit.Old.Date, g.Date),
		validator.StringPtr("Photographer", edit.Old.Photographer, g.Photographer),
		validator.StringPtr("Details", edit.Old.Details, g.Details),
		validator.UUID("StudioID", edit.Old.StudioID, g.StudioID),
		validator.UUID("CoverImageID", edit.Old.CoverImageID, g.CoverImageID),
	}
	for _, field := range edit.OldNullFields {
		switch field {
		case "title":
			if g.Title != nil {
				checks = append(checks, fmt.Errorf("Title changed since edit was created"))
			}
		case "code":
			if g.Code != nil {
				checks = append(checks, fmt.Errorf("Code changed since edit was created"))
			}
		case "date":
			if g.Date != nil {
				checks = append(checks, fmt.Errorf("Date changed since edit was created"))
			}
		case "photographer":
			if g.Photographer != nil {
				checks = append(checks, fmt.Errorf("Photographer changed since edit was created"))
			}
		case "details":
			if g.Details != nil {
				checks = append(checks, fmt.Errorf("Details changed since edit was created"))
			}
		case "studio_id":
			if g.StudioID.Valid {
				checks = append(checks, fmt.Errorf("StudioID changed since edit was created"))
			}
		case "cover_image_id":
			if g.CoverImageID.Valid {
				checks = append(checks, fmt.Errorf("CoverImageID changed since edit was created"))
			}
		}
	}
	return errors.Join(checks...)
}

type GalleryEdit struct {
	EditID            uuid.UUID                  `json:"-"`
	Title             *string                    `json:"title,omitempty"`
	Code              *string                    `json:"code,omitempty"`
	Date              *string                    `json:"date,omitempty"`
	Photographer      *string                    `json:"photographer,omitempty"`
	AddedUrls         []URL                      `json:"added_urls,omitempty"`
	RemovedUrls       []URL                      `json:"removed_urls,omitempty"`
	StudioID          *uuid.UUID                 `json:"studio_id,omitempty"`
	AddedPerformers   []PerformerAppearanceInput `json:"added_performers,omitempty"`
	RemovedPerformers []PerformerAppearanceInput `json:"removed_performers,omitempty"`
	AddedScenes       []uuid.UUID                `json:"added_scenes,omitempty"`
	RemovedScenes     []uuid.UUID                `json:"removed_scenes,omitempty"`
	AddedTags         []uuid.UUID                `json:"added_tags,omitempty"`
	RemovedTags       []uuid.UUID                `json:"removed_tags,omitempty"`
	Details           *string                    `json:"details,omitempty"`
	CoverImageID      *uuid.UUID                 `json:"cover_image_id,omitempty"`
	Images            []GalleryImageInput        `json:"images,omitempty"`
	ImageTagUpdates   []GalleryImageTagUpdate    `json:"image_tag_updates,omitempty"`
	DraftID           *uuid.UUID                 `json:"draft_id,omitempty"`
}

func (GalleryEdit) IsEditDetails() {}

type GalleryEditData struct {
	New           *GalleryEdit `json:"new_data,omitempty"`
	Old           *GalleryEdit `json:"old_data,omitempty"`
	MergeSources  []uuid.UUID  `json:"merge_sources,omitempty"`
	OldNullFields []string     `json:"old_null_fields,omitempty"`
}

type GalleryImageTagUpdate struct {
	Index       int         `json:"index"`
	AddedTags   []uuid.UUID `json:"added_tags,omitempty"`
	RemovedTags []uuid.UUID `json:"removed_tags,omitempty"`
}

type GalleryPerformer struct {
	GalleryID   uuid.UUID
	PerformerID uuid.UUID
	As          *string
}

func (g Gallery) IsDeleted() bool {
	return g.Deleted
}

type GalleryImage struct {
	ID        uuid.UUID         `json:"-"`
	GalleryID uuid.UUID         `json:"gallery_id"`
	Index     int               `json:"index"`
	PHash     FingerprintHash   `json:"phash"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
	Tags      []GalleryImageTag `json:"tags,omitempty"`
}

type GalleryImageTag struct {
	TagID *uuid.UUID `json:"tag_id,omitempty"`
}

type GalleryCreateInput struct {
	Title        *string
	Code         *string
	Date         *string
	Photographer *string
	Details      *string
	StudioID     *uuid.UUID
	CoverImageID *uuid.UUID
	URLs         []URL
	Performers   []PerformerAppearanceInput
	TagIDs       []uuid.UUID
	SceneIDs     []uuid.UUID
	Images       []GalleryImageInput
}

type GalleryUpdateInput struct {
	ID           uuid.UUID
	Title        *string
	Code         *string
	Date         *string
	Photographer *string
	Details      *string
	StudioID     *uuid.UUID
	CoverImageID *uuid.UUID
	URLs         []URL
	Performers   []PerformerAppearanceInput
	TagIDs       []uuid.UUID
	SceneIDs     []uuid.UUID
}

type GalleryImageInput struct {
	Index int
	PHash FingerprintHash
	Tags  []GalleryImageTagInput
}

func ValidateGalleryImages[T any](
	images []T,
	index func(T) int,
	phash func(T) FingerprintHash,
) error {
	seenIndexes := make(map[int]bool, len(images))
	seenPHashes := make(map[FingerprintHash]bool, len(images))
	for _, image := range images {
		imageIndex := index(image)
		imagePHash := phash(image)
		if imageIndex < 1 || imageIndex > len(images) || seenIndexes[imageIndex] {
			return fmt.Errorf("gallery image indexes must be unique and contiguous from 1 to %d", len(images))
		}
		if seenPHashes[imagePHash] {
			return fmt.Errorf("gallery image pHash %s appears more than once", imagePHash.Hex())
		}
		seenIndexes[imageIndex] = true
		seenPHashes[imagePHash] = true
	}
	return nil
}

type GalleryImageTagInput struct {
	TagID *uuid.UUID
}

type GalleryPHashMatch struct {
	Gallery Gallery
	Count   int
}

type GalleryQuery struct {
	Filter        GalleryQueryInput
	PerformerID   *uuid.UUID
	SearchResults *GallerySearchResults
}

type GallerySearchResults struct {
	Galleries []Gallery
	Count     int
}
