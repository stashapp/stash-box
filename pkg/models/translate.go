package models

import (
	"database/sql"
	"fmt"
	"reflect"
	"regexp"
	"time"

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

func (d *editDiff) string(oldVal *string, newVal *string) (oldOut *string, newOut *string) {
	if oldVal != nil && (newVal == nil || *newVal != *oldVal) {
		value := *oldVal
		oldOut = &value
	}

	if newVal != nil && (oldVal == nil || *newVal != *oldVal) {
		value := *newVal
		newOut = &value
	}

	return
}

func (d *editDiff) nullString(oldVal sql.NullString, newVal *string) (oldOut *string, newOut *string) {
	if oldVal.Valid && (newVal == nil || *newVal != oldVal.String) {
		value := oldVal.String
		oldOut = &value
	}

	if newVal != nil && *newVal != "" && (!oldVal.Valid || *newVal != oldVal.String) {
		value := *newVal
		newOut = &value
	}

	return
}

func (d *editDiff) nullInt64(oldVal sql.NullInt64, newVal *int) (oldOut *int64, newOut *int64) {
	if oldVal.Valid && (newVal == nil || int64(*newVal) != oldVal.Int64) {
		value := oldVal.Int64
		oldOut = &value
	}

	if newVal != nil && (!oldVal.Valid || int64(*newVal) != oldVal.Int64) {
		value := int64(*newVal)
		newOut = &value
	}

	return
}

func (d *editDiff) nullUUID(oldVal uuid.NullUUID, newVal *uuid.UUID) (oldOut *uuid.UUID, newOut *uuid.UUID) {
	if oldVal.Valid && (newVal == nil || *newVal != oldVal.UUID) {
		oldOut = &oldVal.UUID
	}

	if newVal != nil && (!oldVal.Valid || *newVal != oldVal.UUID) {
		newOut = newVal
	}

	return
}

func (d *editDiff) nullStringEnum(oldVal sql.NullString, newVal stringEnum) (oldOut *string, newOut *string) {
	newNil := reflect.ValueOf(newVal).IsNil()

	if oldVal.Valid && (newNil || !newVal.IsValid() || newVal.String() != oldVal.String) {
		value := oldVal.String
		oldOut = &value
	}

	if !newNil && newVal.IsValid() && (!oldVal.Valid || newVal.String() != oldVal.String) {
		value := newVal.String()
		newOut = &value
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
		currentUUID := ""
		if current.Valid {
			currentUUID = current.UUID.String()
		}
		v.err = v.error(field, old.String(), currentUUID)
	}
}

var ErrInvalidDate = fmt.Errorf("invalid fuzzy date")
var dateValidator = regexp.MustCompile(`^\d{4}(-\d{2}){0,2}$`)

func ParseFuzzyString(date *string) (SQLDate, sql.NullString, error) {
	if date == nil {
		return SQLDate{Valid: false}, sql.NullString{Valid: false}, nil
	}

	if !dateValidator.MatchString(*date) {
		return SQLDate{Valid: false}, sql.NullString{Valid: false}, ErrInvalidDate
	}

	accuracy := DateAccuracyEnumDay
	fuzzyDate := *date
	if len(fuzzyDate) == 4 {
		accuracy = DateAccuracyEnumYear
		fuzzyDate += "-01-01"
	} else if len(fuzzyDate) == 7 {
		accuracy = DateAccuracyEnumMonth
		fuzzyDate += "-01"
	}

	_, err := time.Parse("2006-01-02", fuzzyDate)
	if err != nil {
		return SQLDate{Valid: false}, sql.NullString{Valid: false}, ErrInvalidDate
	}

	return SQLDate{String: fuzzyDate, Valid: true}, sql.NullString{String: accuracy.String(), Valid: true}, nil
}

func ValidateFuzzyString(date *string) error {
	_, _, err := ParseFuzzyString(date)
	return err
}
