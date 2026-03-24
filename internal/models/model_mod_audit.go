package models

import (
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
)

// ModAudit represents an audit log entry
// Custom definition needed because UserID is stored as UUID but resolved as User
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

// ModAuditQuery is used for lazy-loading audit results
type ModAuditQuery struct {
	Filter ModAuditQueryInput
}

// EditAmendmentAuditData contains information about an amended edit (internal only)
type EditAmendmentAuditData struct {
	EditID      uuid.UUID       `json:"edit_id"`
	AmendedBy   uuid.UUID       `json:"amended_by"`
	AmendedAt   time.Time       `json:"amended_at"`
	RemovedData json.RawMessage `json:"removed_data"`
}
