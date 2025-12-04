package utils

import (
	"fmt"
	"time"
)

const railsTimeLayout = "2006-01-02 15:04:05 MST"

// PadIncompleteDate pads incomplete date strings (YYYY or YYYY-MM) to complete dates (YYYY-MM-DD)
func PadIncompleteDate(date string) string {
	switch len(date) {
	case 4:
		return fmt.Sprintf("%s-01-01", date)
	case 7:
		return fmt.Sprintf("%s-01", date)
	default:
		return date
	}
}

func ParseDateStringAsTime(dateString string) (time.Time, error) {
	// https://stackoverflow.com/a/20234207 WTF?

	t, e := time.Parse(time.RFC3339, dateString)
	if e == nil {
		return t, nil
	}

	t, e = time.Parse("2006-01-02", dateString)
	if e == nil {
		return t, nil
	}

	t, e = time.Parse("2006-01-02 15:04:05", dateString)
	if e == nil {
		return t, nil
	}

	t, e = time.Parse(railsTimeLayout, dateString)
	if e == nil {
		return t, nil
	}

	// Handle incomplete dates by padding with -01 or -01-01
	paddedDateString := PadIncompleteDate(dateString)
	if paddedDateString != dateString {
		t, e = time.Parse("2006-01-02", paddedDateString)
		if e == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("ParseDateStringAsTime failed: dateString <%s>", dateString)
}
