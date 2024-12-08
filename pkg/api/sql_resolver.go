package api

import (
	"database/sql"
	"fmt"

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

func resolveFuzzyDate(date sql.NullString) *models.FuzzyDate {
	if !date.Valid {
		return nil
	}

	switch {
	case len(date.String) == 4:
		return &models.FuzzyDate{
			Accuracy: models.DateAccuracyEnumYear,
			Date:     fmt.Sprintf("%s-01-01", date.String),
		}
	case len(date.String) == 7:
		return &models.FuzzyDate{
			Accuracy: models.DateAccuracyEnumMonth,
			Date:     fmt.Sprintf("%s-01", date.String),
		}
	case len(date.String) == 10:
		return &models.FuzzyDate{
			Accuracy: models.DateAccuracyEnumDay,
			Date:     date.String,
		}
	}

	return nil
}
