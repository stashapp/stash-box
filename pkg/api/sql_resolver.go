package api

import (
	"database/sql"
	"reflect"

	"github.com/stashapp/stashdb/pkg/models"
	"github.com/stashapp/stashdb/pkg/utils"
)

type validator interface {
	IsValid() bool
}

func resolveNullString(value sql.NullString) (*string, error) {
	if value.Valid {
		return &value.String, nil
	}
	return nil, nil
}

func validateEnum(value interface{}) bool {
	v, ok := value.(validator)
	if !ok {
		// shouldn't happen
		return false
	}

	return v.IsValid()
}

func resolveEnum(value sql.NullString, out interface{}) bool {
	if !value.Valid {
		return false
	}

	outValue := reflect.ValueOf(out).Elem()
	outValue.SetString(value.String)

	return validateEnum(out)
}

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
