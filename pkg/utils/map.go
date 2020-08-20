package utils

import "strings"

// FindField traverses a json map, searching for the field matching the
// qualified field string provided.
//
// For example: a qualifiedField of "foo" returns value of the "foo" key in the
// provided map. A qualifiedField of "foo.bar" will find the "foo" value, and
// if it is a map[string]interface{}, will return the "bar" value of that map.
// Returns the value and true if the value was found. Returns nil and false if
// the value was not found, or if one of the intermediate values was not a
// map[string]interface{}
func FindField(m map[string]interface{}, qualifiedField string) (interface{}, bool) {
	const delimiter = "."
	fields := strings.Split(qualifiedField, delimiter)

	var current interface{}
	current = m
	for _, field := range fields {
		asMap, ok := current.(map[string]interface{})
		if !ok {
			return nil, false
		}

		current, ok = asMap[field]
		if !ok {
			return nil, false
		}
	}

	return current, true
}
