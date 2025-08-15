// nolint: revive
package utils

import (
	"database/sql"
	"reflect"
)

type validator interface {
	IsValid() bool
}

func validateEnum(value interface{}) bool {
	v, ok := value.(validator)
	if !ok {
		// shouldn't happen
		return false
	}

	return v.IsValid()
}

func ResolveEnum(value sql.NullString, out interface{}) bool {
	if !value.Valid {
		return false
	}

	outValue := reflect.ValueOf(out).Elem()
	outValue.SetString(value.String)

	return validateEnum(out)
}

func ResolveEnumString(value string, out interface{}) bool {
	if value == "" {
		return false
	}

	outValue := reflect.ValueOf(out).Elem()
	outValue.SetString(value)

	return validateEnum(out)
}
