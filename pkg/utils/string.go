// nolint: revive
package utils

func StrPtrToString(val *string) string {
	if val == nil {
		return ""
	}
	return *val
}

func StringToStrPtr(val string) *string {
	if val == "" {
		return nil
	}
	return &val
}
