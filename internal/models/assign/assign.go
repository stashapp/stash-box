package assign

import (
	"reflect"

	"github.com/gofrs/uuid"
)

type StringEnum interface {
	IsValid() bool
	String() string
}

// String assigns string value from input if not nil
func String(out *string, in *string) {
	if in != nil {
		*out = *in
	}
}

// StringPtr assigns string pointer value with three-way logic: input, old, or keep existing
func StringPtr(out **string, in *string, old *string) {
	if in != nil {
		*out = in
	} else if old != nil {
		*out = nil
	}
}

// IntPtr assigns int pointer value from int input with three-way logic
func IntPtr(out **int, in *int, old *int) {
	if in != nil {
		val := int(*in)
		*out = &val
	} else if old != nil {
		*out = nil
	}
}

// NullUUID assigns uuid.NullUUID value with three-way logic
func NullUUID(out *uuid.NullUUID, in *uuid.UUID, old *uuid.UUID) {
	if in != nil {
		out.UUID = *in
		out.Valid = true
	} else if old != nil {
		*out = uuid.NullUUID{}
	}
}

// EnumPtr assigns enum pointer value with three-way logic using generics
func EnumPtr[T StringEnum](out **T, in *string, old *string) {
	if in != nil {
		// Use reflection to create an enum from string
		var zero T
		enumType := reflect.TypeOf(zero)
		enumVal := reflect.New(enumType).Elem()
		enumVal.SetString(*in)
		enum := enumVal.Interface().(T)
		*out = &enum
	} else if old != nil {
		*out = nil
	}
}
