package utils

import "github.com/gofrs/uuid"

// UUIDSliceCompare returns a slice of UUIDs that are present in subject but
// not in against - in the added slice - and a slice of strings that are not
// present in subject, and are in against - in the missing slice.
func UUIDSliceCompare(subject []uuid.UUID, against []uuid.UUID) (added []uuid.UUID, missing []uuid.UUID) {
	for _, v := range subject {
		if !UUIDInclude(against, v) && !UUIDInclude(added, v) {
			added = append(added, v)
		}
	}

	for _, v := range against {
		if !UUIDInclude(subject, v) && !UUIDInclude(missing, v) {
			missing = append(missing, v)
		}
	}

	return
}

func UUIDInclude(vs []uuid.UUID, t uuid.UUID) bool {
	return UUIDIndex(vs, t) >= 0
}

func UUIDIndex(vs []uuid.UUID, t uuid.UUID) int {
	for i, v := range vs {
		if v == t {
			return i
		}
	}
	return -1
}
