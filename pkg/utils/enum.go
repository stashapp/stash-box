// nolint: revive
package utils

import (
	"reflect"
)

type validator interface {
	IsValid() bool
}

func validateEnum(value any) bool {
	v, ok := value.(validator)
	if !ok {
		// shouldn't happen
		return false
	}

	return v.IsValid()
}

func ResolveEnumString(value string, out any) bool {
	if value == "" {
		return false
	}

	outValue := reflect.ValueOf(out).Elem()
	outValue.SetString(value)

	return validateEnum(out)
}
