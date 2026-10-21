//go:build integration

package api_test

import (
	"database/sql"
	"uuid"
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

func (c *fieldComparator) strPtrNullUUID(expected *string, actual *uuid.UUID, field string) {
	c.r.t.Helper()
	if expected == nil && actual == nil {
		return
	}

	matched := true
	if expected == nil || actual == nil {
		matched = false
	} else {
		matched = *expected == actual.String()
	}

	if !matched {
		c.r.fieldMismatch(expected, actual.String(), field)
	}
}

func (c *fieldComparator) intPtrIntPtr(expected *int, actual *int, field string) {
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

func (c *fieldComparator) uuidPtrUUIDPtr(expected *uuid.UUID, actual *uuid.UUID, field string) {
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

func (c *fieldComparator) uuidPtrNullUUID(expected *uuid.UUID, actual *uuid.UUID, field string) {
	c.r.t.Helper()
	if expected == nil && actual == nil {
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
