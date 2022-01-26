package models

import (
	"database/sql"
	"fmt"
	"reflect"

	"github.com/gofrs/uuid"
)

type ErrEditPrerequisiteFailed struct {
	field    string
	expected interface{}
	actual   interface{}
}

func (e *ErrEditPrerequisiteFailed) Error() string {
	expected := "_blank_"
	if e.expected != "" {
		expected = fmt.Sprintf("“**%v**”", e.expected)
	}
	actual := "_blank_"
	if e.actual != "" {
		actual = fmt.Sprintf("“**%v**”", e.actual)
	}
	return fmt.Sprintf("Expected %s to be %s, but was %s.", e.field, expected, actual)
}

// fromEdit translates edit object fields into entity fields
type fromEdit struct {
}

func (c *fromEdit) string(out *string, in *string) {
	if in != nil {
		*out = *in
	}
}

func (c *fromEdit) nullString(out *sql.NullString, in *string, old *string) {
	if in != nil {
		out.String = *in
		out.Valid = true
	} else if old != nil {
		*out = sql.NullString{}
	}
}

func (c *fromEdit) nullInt64(out *sql.NullInt64, in *int64, old *int64) {
	if in != nil {
		out.Int64 = *in
		out.Valid = true
	} else if old != nil {
		*out = sql.NullInt64{}
	}
}

func (c *fromEdit) sqliteDate(out *SQLiteDate, in *string, old *string) {
	if in != nil {
		out.String = *in
		out.Valid = true
	} else if old != nil {
		*out = SQLiteDate{}
	}
}

func (c *fromEdit) nullUUID(out *uuid.NullUUID, in *uuid.UUID, old *uuid.UUID) {
	if in != nil {
		out.UUID = *in
		out.Valid = true
	} else if old != nil {
		*out = uuid.NullUUID{}
	}
}

// editDiff translates edit details input fields into edit data
type editDiff struct {
}

type stringEnum interface {
	IsValid() bool
	String() string
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

	if new != nil && *new != "" && (!old.Valid || *new != old.String) {
		newVal := *new
		newOut = &newVal
	}

	return
}

func (d *editDiff) nullInt64(old sql.NullInt64, new *int) (oldOut *int64, newOut *int64) {
	if old.Valid && (new == nil || int64(*new) != old.Int64) {
		oldVal := old.Int64
		oldOut = &oldVal
	}

	if new != nil && (!old.Valid || int64(*new) != old.Int64) {
		newVal := int64(*new)
		newOut = &newVal
	}

	return
}

func (d *editDiff) nullUUID(old uuid.NullUUID, new *uuid.UUID) (oldOut *uuid.UUID, newOut *uuid.UUID) {
	if old.Valid && (new == nil || *new != old.UUID) {
		oldOut = &old.UUID
	}

	if new != nil && (!old.Valid || *new != old.UUID) {
		newOut = new
	}

	return
}

func (d *editDiff) nullStringEnum(old sql.NullString, new stringEnum) (oldOut *string, newOut *string) {
	newNil := reflect.ValueOf(new).IsNil()

	if old.Valid && (newNil || !new.IsValid() || new.String() != old.String) {
		oldVal := old.String
		oldOut = &oldVal
	}

	if !newNil && new.IsValid() && (!old.Valid || new.String() != old.String) {
		newVal := new.String()
		newOut = &newVal
	}

	return
}

func (d *editDiff) fuzzyDate(oldDate SQLiteDate, oldAcc sql.NullString, new *FuzzyDateInput) (outOldDate, outOldAcc, outNewDate, outNewAcc *string) {
	if new == nil && oldDate.Valid {
		outOldDate = &oldDate.String
		if oldAcc.Valid {
			outOldAcc = &oldAcc.String
		}
	} else if new != nil && (!oldDate.Valid || new.Date != oldDate.String || new.Accuracy.String() != oldAcc.String) {
		outNewDate = &new.Date
		newAccuracy := new.Accuracy.String()
		outNewAcc = &newAccuracy
		if oldDate.Valid {
			outOldDate = &oldDate.String
		}
		if oldAcc.Valid {
			outOldAcc = &oldAcc.String
		}
	}

	return
}

func (d *editDiff) sqliteDate(old SQLiteDate, new *string) (oldOut *string, newOut *string) {
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

type editValidator struct {
	err error
}

func (v *editValidator) error(field string, expected interface{}, actual interface{}) error {
	return &ErrEditPrerequisiteFailed{field, expected, actual}
}

func (v *editValidator) string(field string, old *string, current string) {
	if v.err != nil {
		return
	}

	if old != nil && *old != current {
		v.err = v.error(field, *old, current)
	}
}

func (v *editValidator) int64(field string, old *int64, current int64) {
	if v.err != nil {
		return
	}

	if old != nil && *old != current {
		v.err = v.error(field, *old, current)
	}
}

func (v *editValidator) uuid(field string, old *uuid.UUID, current uuid.NullUUID) {
	if v.err != nil {
		return
	}

	if old != nil && (!current.Valid || (*old != current.UUID)) {
		v.err = v.error(field, *old, current)
	}
}
