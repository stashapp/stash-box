package models

import (
	"fmt"
	"strings"
	"time"

	"github.com/stashapp/stash-box/pkg/utils"
)

type JSONTime struct {
	time.Time
}

func (jt *JSONTime) UnmarshalJSON(b []byte) (err error) {
	s := strings.Trim(string(b), "\"")
	if s == "null" {
		jt.Time = time.Time{}
		return
	}

	jt.Time, err = utils.ParseDateStringAsTime(s)
	return
}

func (jt *JSONTime) MarshalJSON() ([]byte, error) {
	if jt.IsZero() {
		return []byte("null"), nil
	}
	return []byte(fmt.Sprintf("\"%s\"", jt.Format(time.RFC3339))), nil
}
