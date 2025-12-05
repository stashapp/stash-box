package utils

import (
	"fmt"
	"time"
)

func ParseDateStringAsTime(dateString string) (time.Time, error) {
	switch len(dateString) {
	case 4:
		t, e := time.Parse("2006", dateString)
		if e == nil {
			return t, nil
		}
	case 7:
		t, e := time.Parse("2006-01", dateString)
		if e == nil {
			return t, nil
		}
	default:
		t, e := time.Parse("2006-01-02", dateString)
		if e == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("ParseDateStringAsTime failed: dateString <%s>", dateString)
}
