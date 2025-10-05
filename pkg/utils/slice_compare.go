// nolint: revive
package utils

func Includes[T comparable](arr []T, against T) bool {
	for _, v := range arr {
		if v == against {
			return true
		}
	}
	return false
}

func SliceCompare[T comparable](subject []T, against []T) (added []T, missing []T) {
	for _, v := range subject {
		if !Includes(against, v) && !Includes(added, v) {
			added = append(added, v)
		}
	}

	for _, v := range against {
		if !Includes(subject, v) && !Includes(missing, v) {
			missing = append(missing, v)
		}
	}

	return
}
