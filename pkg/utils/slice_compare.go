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

func ProcessSlice[T comparable](current []T, added []T, removed []T) []T {
	for _, v := range removed {
		for i, k := range current {
			if v == k {
				current[i] = current[len(current)-1]
				current = current[:len(current)-1]
				break
			}
		}
	}

	for i := range added {
		if !Includes(current, added[i]) {
			current = append(current, added[i])
		}
	}

	return current
}
