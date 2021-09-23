//go:build integration
// +build integration

package api_test

import (
	"database/sql"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

type fieldComparator struct {
	r *testRunner
}

func (c *fieldComparator) strPtrStrPtr(expected *string, actual *string, field string) {
	c.r.t.Helper()
	if expected == actual {
		return
	}

	matched := true
	if expected == nil || actual == nil {
		matched = false
	} else {
		matched = *expected == *actual
	}

	if !matched {
		c.r.fieldMismatch(expected, actual, field)
	}
}

func (c *fieldComparator) strPtrNullStr(expected *string, actual sql.NullString, field string) {
	c.r.t.Helper()
	if expected == nil && !actual.Valid {
		return
	}

	matched := true
	if expected == nil || !actual.Valid {
		matched = false
	} else {
		matched = *expected == actual.String
	}

	if !matched {
		c.r.fieldMismatch(expected, actual.String, field)
	}
}

func (c *fieldComparator) strPtrNullUUID(expected *string, actual uuid.NullUUID, field string) {
	c.r.t.Helper()
	if expected == nil && !actual.Valid {
		return
	}

	matched := true
	if expected == nil || !actual.Valid {
		matched = false
	} else {
		matched = *expected == actual.UUID.String()
	}

	if !matched {
		c.r.fieldMismatch(expected, actual.UUID.String(), field)
	}
}

func (c *fieldComparator) strPtrSQLiteDate(expected *string, actual models.SQLiteDate, field string) {
	c.r.t.Helper()
	if expected == nil && !actual.Valid {
		return
	}

	matched := true
	if expected == nil || !actual.Valid {
		matched = false
	} else {
		matched = *expected == actual.String
	}

	if !matched {
		c.r.fieldMismatch(expected, actual.String, field)
	}
}

func (c *fieldComparator) intPtrInt64Ptr(expected *int, actual *int64, field string) {
	c.r.t.Helper()
	if expected == nil && actual == nil {
		return
	}

	matched := true
	if expected == nil || actual == nil {
		matched = false
	} else {
		matched = int64(*expected) == *actual
	}

	if !matched {
		c.r.fieldMismatch(expected, actual, field)
	}
}

func (c *fieldComparator) intPtrNullInt64(expected *int, actual sql.NullInt64, field string) {
	c.r.t.Helper()
	if expected == nil && !actual.Valid {
		return
	}

	matched := true
	if expected == nil || !actual.Valid {
		matched = false
	} else {
		matched = int64(*expected) == actual.Int64
	}

	if !matched {
		c.r.fieldMismatch(expected, actual.Int64, field)
	}
}
