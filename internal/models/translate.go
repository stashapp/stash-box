package models

import (
	"fmt"
	"reflect"
	"regexp"
	"time"

	"github.com/gofrs/uuid"
)

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

func (d *editDiff) int(oldVal *int, newVal *int) (oldOut *int, newOut *int) {
	if oldVal != nil && (newVal == nil || *newVal != *oldVal) {
		oldOut = oldVal
	}

	if newVal != nil && (oldVal == nil || *newVal != *oldVal) {
		newOut = newVal
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

func (d *editDiff) enum(oldVal stringEnum, newVal stringEnum) (oldOut *string, newOut *string) {
	oldNil := reflect.ValueOf(oldVal).IsNil()
	newNil := reflect.ValueOf(newVal).IsNil()

	if !oldNil && oldVal.IsValid() && (newNil || !newVal.IsValid() || newVal.String() != oldVal.String()) {
		value := oldVal.String()
		oldOut = &value
	}

	if !newNil && newVal.IsValid() && (oldNil || !oldVal.IsValid() || newVal.String() != oldVal.String()) {
		value := newVal.String()
		newOut = &value
	}

	return
}

var ErrInvalidDate = fmt.Errorf("invalid fuzzy date")
var dateValidator = regexp.MustCompile(`^\d{4}(-\d{2}){0,2}$`)

func ValidateFuzzyString(date *string) error {
	if date == nil {
		return nil
	}

	if !dateValidator.MatchString(*date) {
		return ErrInvalidDate
	}

	fuzzyDate := *date
	if len(fuzzyDate) == 4 {
		fuzzyDate += "-01-01"
	} else if len(fuzzyDate) == 7 {
		fuzzyDate += "-01"
	}

	_, err := time.Parse("2006-01-02", fuzzyDate)
	if err != nil {
		return ErrInvalidDate
	}

	return nil
}
