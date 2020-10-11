package api

import (
	"github.com/stashapp/stashdb/pkg/models"
	"github.com/stashapp/stashdb/pkg/utils"
)

func resolveSQLiteDate(value models.SQLiteDate) (*string, error) {
	if value.Valid {
		result := utils.GetYMDFromDatabaseDate(value.String)
		return &result, nil
	}
	return nil, nil
}
