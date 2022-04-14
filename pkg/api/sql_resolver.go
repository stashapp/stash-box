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
func resolveSQLiteDate(value models.SQLiteDate) (*string, error) {
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
