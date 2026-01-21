package models

import (
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
)

// ModAuditActionEnum represents the type of moderator audit action
type ModAuditActionEnum string

const (
	ModAuditActionEnumEditDelete ModAuditActionEnum = "EDIT_DELETE"
)

func (e ModAuditActionEnum) String() string {
	return string(e)
}

func (e ModAuditActionEnum) IsValid() bool {
	return e == ModAuditActionEnumEditDelete
}

// EditDeleteAuditData contains all the information preserved about a deleted edit
type EditDeleteAuditData struct {
	EditID     uuid.UUID       `json:"edit_id"`
	UserID     uuid.NullUUID   `json:"user_id"` // Original submitter
	TargetType string          `json:"target_type"`
	Operation  string          `json:"operation"`
	Status     string          `json:"status"`
	Applied    bool            `json:"applied"`
	VoteCount  int             `json:"vote_count"`
	Bot        bool            `json:"bot"`
	Data       json.RawMessage `json:"data"` // The edit's JSONB data
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  *time.Time      `json:"updated_at,omitempty"`
	ClosedAt   *time.Time      `json:"closed_at,omitempty"`
	DeletedBy  uuid.UUID       `json:"deleted_by"` // Admin who deleted it
	DeletedAt  time.Time       `json:"deleted_at"`
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
