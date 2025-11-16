package models

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models/assign"
	"github.com/stashapp/stash-box/internal/models/validator"
)

type Scene struct {
	ID             uuid.UUID     `json:"id"`
	Title          *string       `json:"title"`
	Details        *string       `json:"details"`
	Date           *string       `json:"date"`
	ProductionDate *string       `json:"production_date"`
	StudioID       uuid.NullUUID `json:"studio_id"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
	Duration       *int          `json:"duration"`
	Director       *string       `json:"director"`
	Code           *string       `json:"code"`
	Deleted        bool          `json:"deleted"`
}

func (s *Scene) IsEditTarget() {}

type SceneFingerprint struct {
	SceneID   uuid.UUID `json:"scene_id"`
	UserID    uuid.UUID `json:"user_id"`
	Hash      string    `json:"hash"`
	Algorithm string    `json:"algorithm"`
	Duration  int       `json:"duration"`
	CreatedAt time.Time `json:"created_at"`
	Vote      int       `json:"vote"`
}

type SceneQuery struct {
	Filter SceneQueryInput
}

type QueryExistingSceneResult struct {
	Input QueryExistingSceneInput
}

func (s Scene) IsDeleted() bool {
	return s.Deleted
}

func (s *Scene) CopyFromSceneEdit(input SceneEdit, old *SceneEdit) {
	assign.StringPtr(&s.Title, input.Title, old.Title)
	assign.StringPtr(&s.Details, input.Details, old.Details)
	assign.NullUUID(&s.StudioID, input.StudioID, old.StudioID)
	assign.IntPtr(&s.Duration, input.Duration, old.Duration)
	assign.StringPtr(&s.Director, input.Director, old.Director)
	assign.StringPtr(&s.Code, input.Code, old.Code)
	assign.StringPtr(&s.Date, input.Date, old.Date)
	assign.StringPtr(&s.ProductionDate, input.ProductionDate, old.ProductionDate)
}

func (s *Scene) ValidateModifyEdit(edit SceneEditData) error {
	if err := validator.StringPtr("Title", edit.Old.Title, s.Title); err != nil {
		return err
	}
	if err := validator.StringPtr("Details", edit.Old.Details, s.Details); err != nil {
		return err
	}
	if err := validator.StringPtr("Date", edit.Old.Date, s.Date); err != nil {
		return err
	}
	if err := validator.StringPtr("ProductionDate", edit.Old.ProductionDate, s.ProductionDate); err != nil {
		return err
	}
	if err := validator.UUID("StudioID", edit.Old.StudioID, s.StudioID); err != nil {
		return err
	}
	if err := validator.IntPtr("Duration", edit.Old.Duration, s.Duration); err != nil {
		return err
	}
	if err := validator.StringPtr("Director", edit.Old.Director, s.Director); err != nil {
		return err
	}
	return validator.StringPtr("Code", edit.Old.Code, s.Code)
}

type PerformerScene struct {
	PerformerID uuid.UUID
	As          *string
	SceneID     uuid.UUID
}
