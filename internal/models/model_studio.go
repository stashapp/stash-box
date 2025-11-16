package models

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models/assign"
	"github.com/stashapp/stash-box/internal/models/validator"
)

type Studio struct {
	ID             uuid.UUID     `json:"id"`
	Name           string        `json:"name"`
	ParentStudioID uuid.NullUUID `json:"parent_studio_id"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
	Deleted        bool          `json:"deleted"`
}

func (Studio) IsSceneDraftStudio() {}
func (s *Studio) IsEditTarget()    {}

func (s Studio) IsDeleted() bool {
	return s.Deleted
}

func (s *Studio) CopyFromStudioEdit(input StudioEdit, existing *StudioEdit) {
	assign.String(&s.Name, input.Name)
	assign.NullUUID(&s.ParentStudioID, input.ParentID, existing.ParentID)
}

func (s *Studio) ValidateModifyEdit(edit StudioEditData) error {
	if err := validator.String("name", edit.Old.Name, s.Name); err != nil {
		return err
	}
	return validator.UUID("ParentID", edit.Old.ParentID, s.ParentStudioID)
}
