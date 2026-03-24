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
