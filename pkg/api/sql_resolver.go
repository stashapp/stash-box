package api

import (
	"database/sql"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

func resolveNullString(value sql.NullString) *string {
	if value.Valid {
		return &value.String
	}
	return nil
}

//nolint:deadcode,unused
func resolveSQLDate(value models.SQLDate) (*string, error) {
	if value.Valid {
		result := utils.GetYMDFromDatabaseDate(value.String)
		return &result, nil
	}
	return nil, nil
}

func resolveNullInt64(value sql.NullInt64) (*int, error) {
	if value.Valid {
		result := int(value.Int64)
		return &result, nil
	}
	return nil, nil
}

func resolveFuzzyDate(date *string, accuracy *string) *string {
	if date == nil || *date == "" {
		return nil
	}

	resolvedAccuracy := models.DateAccuracyEnumDay.String()
	if accuracy != nil && *accuracy != "" {
		resolvedAccuracy = *accuracy
	}

	switch resolvedAccuracy {
	case models.DateAccuracyEnumDay.String():
		return date
	case models.DateAccuracyEnumMonth.String():
		ret := (*date)[0:7]
		return &ret
	case models.DateAccuracyEnumYear.String():
		ret := (*date)[0:4]
		return &ret
	}

	return nil
}
