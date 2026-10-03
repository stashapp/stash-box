// nolint: revive
package utils

import "slices"

func Includes[T comparable](arr []T, against T) bool {
	return slices.Contains(arr, against)
}

func SliceCompare[T comparable](subject []T, against []T) (added []T, missing []T) {
	againstSet := makeSet(against)
	subjectSet := makeSet(subject)

	for _, v := range subject {
		if _, found := againstSet[v]; found {
			continue
		}

		added = append(added, v)
		againstSet[v] = struct{}{}
	}

	for _, v := range against {
		if _, found := subjectSet[v]; found {
			continue
		}
		missing = append(missing, v)
		subjectSet[v] = struct{}{}
	}

	return
}

func makeSet[T comparable](values []T) map[T]struct{} {
	ret := make(map[T]struct{}, len(values))
	for _, v := range values {
		ret[v] = struct{}{}
	}

	return ret
}
