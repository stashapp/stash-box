package goverter

import (
	"time"
)

// Extend functions for type conversions

func ConvertTime(t time.Time) time.Time {
	return t
}

func ConvertNullIntToInt(i *int) int {
	if i != nil {
		return *i
	}
	return 0
}
