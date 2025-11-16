package validator

import (
	"fmt"
	"reflect"

	"github.com/gofrs/uuid"
)

type StringEnum interface {
	IsValid() bool
	String() string
}

type ErrEditPrerequisiteFailed struct {
	field    string
	expected interface{}
	actual   interface{}
}

func (e *ErrEditPrerequisiteFailed) Error() string {
	expected := "_blank_"
	if e.expected != "" {
		expected = fmt.Sprintf("**%v**", e.expected)
	}
	actual := "_blank_"
	if e.actual != "" {
		actual = fmt.Sprintf("**%v**", e.actual)
	}
	return fmt.Sprintf("Expected %s to be %s, but was %s.", e.field, expected, actual)
}

func newError(field string, expected interface{}, actual interface{}) error {
	return &ErrEditPrerequisiteFailed{field, expected, actual}
}

// String validates string fields
func String(field string, old *string, current string) error {
	if old != nil && *old != current {
		return newError(field, *old, current)
	}
	return nil
}

// StringPtr validates string pointer fields
func StringPtr(field string, old *string, current *string) error {
	if old != nil && current != nil {
		if *old != *current {
			return newError(field, *old, *current)
		}
	}
	return nil
}

// IntPtr validates int pointer fields
func IntPtr(field string, old *int, current *int) error {
	if old != nil && current != nil {
		if *old != *current {
			return newError(field, *old, current)
		}
	}
	return nil
}

// UUID validates UUID fields
func UUID(field string, old *uuid.UUID, current uuid.NullUUID) error {
	if old != nil && (!current.Valid || (*old != current.UUID)) {
		currentUUID := ""
		if current.Valid {
			currentUUID = current.UUID.String()
		}
		return newError(field, old.String(), currentUUID)
	}
	return nil
}

// EnumPtr validates enum pointer fields using generics
func EnumPtr[T StringEnum](field string, old *string, current *T) error {
	if old != nil && current != nil {
		currentVal := reflect.ValueOf(current)
		if !currentVal.IsNil() {
			currentEnum := currentVal.Interface().(T)
			if currentEnum.IsValid() && *old != currentEnum.String() {
				return newError(field, *old, currentEnum.String())
			}
		}
	}
	return nil
}
