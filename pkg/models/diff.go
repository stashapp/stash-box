package models

import (
	"database/sql"

	"github.com/gofrs/uuid"
)

type editDiff struct {
}

func (d *editDiff) string(old *string, new *string) (oldOut *string, newOut *string) {
	if old != nil && (new == nil || *new != *old) {
		oldVal := *old
		oldOut = &oldVal
	}

	if new != nil && (old == nil || *new != *old) {
		newVal := *new
		newOut = &newVal
	}

	return
}

func (d *editDiff) nullString(old sql.NullString, new *string) (oldOut *string, newOut *string) {
	if old.Valid && (new == nil || *new != old.String) {
		oldVal := old.String
		oldOut = &oldVal
	}

	if new != nil && (!old.Valid || *new != old.String) {
		newVal := *new
		newOut = &newVal
	}

	return
}

func (d *editDiff) nullUUID(old uuid.NullUUID, new *string) (oldOut *string, newOut *string) {
	oldStr := old.UUID.String()
	if old.Valid && (new == nil || *new != oldStr) {
		oldOut = &oldStr
	}

	if new != nil && (!old.Valid || *new != oldStr) {
		newVal := *new
		newOut = &newVal
	}

	return
}
