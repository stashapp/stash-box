package models

import (
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
)

type ModAudit struct {
	ID         uuid.UUID     `json:"id"`
	Action     string        `json:"action"`
	UserID     uuid.NullUUID `json:"user_id"`
	TargetID   uuid.UUID     `json:"target_id"`
	TargetType string        `json:"target_type"`
	Data       string        `json:"data"`
	Reason     *string       `json:"reason,omitempty"`
	CreatedAt  time.Time     `json:"created_at"`
}

type ModAuditQuery struct {
	Filter ModAuditQueryInput
}

type EditAmendmentAuditData struct {
	EditID      uuid.UUID       `json:"edit_id"`
	AmendedBy   uuid.UUID       `json:"amended_by"`
	AmendedAt   time.Time       `json:"amended_at"`
	RemovedData json.RawMessage `json:"removed_data"`
}

type EditCommentUpdateAuditData struct {
	CommentID    uuid.UUID `json:"comment_id"`
	EditID       uuid.UUID `json:"edit_id"`
	UpdatedBy    uuid.UUID `json:"updated_by"`
	UpdatedAt    time.Time `json:"updated_at"`
	PreviousText string    `json:"previous_text"`
}

type EditCommentHideAuditData struct {
	CommentID uuid.UUID `json:"comment_id"`
	EditID    uuid.UUID `json:"edit_id"`
	ChangedBy uuid.UUID `json:"changed_by"`
	ChangedAt time.Time `json:"changed_at"`
	Hidden    bool      `json:"hidden"`
}
