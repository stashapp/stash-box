package utils

func StrPtrToString(val *string) string {
	if val == nil {
		return ""
	}
	return *val
}
