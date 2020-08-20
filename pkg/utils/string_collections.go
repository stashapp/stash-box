package utils

// https://gobyexample.com/collection-functions

func StrIndex(vs []string, t string) int {
	for i, v := range vs {
		if v == t {
			return i
		}
	}
	return -1
}

func StrInclude(vs []string, t string) bool {
	return StrIndex(vs, t) >= 0
}

func StrFilter(vs []string, f func(string) bool) []string {
	vsf := make([]string, 0)
	for _, v := range vs {
		if f(v) {
			vsf = append(vsf, v)
		}
	}
	return vsf
}

func StrMap(vs []string, f func(string) string) []string {
	vsm := make([]string, len(vs))
	for i, v := range vs {
		vsm[i] = f(v)
	}
	return vsm
}

// StrSliceCompare returns a slice of strings that are present in subject but
// not in against - in the added slice - and a slice of strings that are not
// present in subject, and are in against - in the missing slice.
func StrSliceCompare(subject []string, against []string) (added []string, missing []string) {
	for _, v := range subject {
		if !StrInclude(against, v) && !StrInclude(added, v) {
			added = append(added, v)
		}
	}

	for _, v := range against {
		if !StrInclude(subject, v) && !StrInclude(missing, v) {
			missing = append(missing, v)
		}
	}

	return
}
