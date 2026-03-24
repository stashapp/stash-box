package models

import (
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
)

type ModAuditActionEnum string

const (
	ModAuditActionEnumEditDelete    ModAuditActionEnum = "EDIT_DELETE"
	ModAuditActionEnumEditAmendment ModAuditActionEnum = "EDIT_AMENDMENT"
)

func (e ModAuditActionEnum) String() string {
	return string(e)
}

func (e ModAuditActionEnum) IsValid() bool {
	return e == ModAuditActionEnumEditDelete || e == ModAuditActionEnumEditAmendment
}

// DeleteEditInput is the input for deleting an edit
type DeleteEditInput struct {
	ID     uuid.UUID `json:"id"`
	Reason string    `json:"reason"`
}

// ModAudit represents an audit log entry
type ModAudit struct {
	ID         uuid.UUID     `json:"id"`
	Action     string        `json:"action"`
	UserID     uuid.NullUUID `json:"user_id"`
	TargetID   uuid.UUID     `json:"target_id"`
	TargetType string        `json:"target_type"`
	Data       string        `json:"data"` // JSON string for GraphQL
	Reason     *string       `json:"reason,omitempty"`
	CreatedAt  time.Time     `json:"created_at"`
}

// ModAuditQueryInput represents the input for querying audit logs
type ModAuditQueryInput struct {
	Page    int                 `json:"page"`
	PerPage int                 `json:"per_page"`
	Action  *ModAuditActionEnum `json:"action,omitempty"`
	UserID  *uuid.UUID          `json:"user_id,omitempty"`
}

// ModAuditQuery is used for lazy-loading audit results
type ModAuditQuery struct {
	Filter ModAuditQueryInput
}

// EditAmendmentAuditData contains information about an amended edit
type EditAmendmentAuditData struct {
	EditID      uuid.UUID       `json:"edit_id"`
	AmendedBy   uuid.UUID       `json:"amended_by"`
	AmendedAt   time.Time       `json:"amended_at"`
	RemovedData json.RawMessage `json:"removed_data"`
}

// AmendEditInput is the input for amending an edit
type AmendEditInput struct {
	ID                 uuid.UUID          `json:"id"`
	Reason             string             `json:"reason"`
	RemoveFields       []string           `json:"remove_fields"`
	RemoveAddedItems   []AmendItemRemoval `json:"remove_added_items"`
	RemoveRemovedItems []AmendItemRemoval `json:"remove_removed_items"`
}

// AmendItemRemoval specifies which array items to remove
type AmendItemRemoval struct {
	Field   string `json:"field"`
	Indices []int  `json:"indices"`
}
