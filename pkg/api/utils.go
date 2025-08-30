package api

import (
	"fmt"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

func parseUUID(id string) uuid.UUID {
	trimmed := strings.TrimSpace(id)
	return uuid.FromStringOrNil(trimmed)
}

func resolveFuzzyDate(date *string) *models.FuzzyDate {
	if date == nil {
		return nil
	}

	switch {
	case len(*date) == 4:
		return &models.FuzzyDate{
			Accuracy: models.DateAccuracyEnumYear,
			Date:     fmt.Sprintf("%s-01-01", *date),
		}
	case len(*date) == 7:
		return &models.FuzzyDate{
			Accuracy: models.DateAccuracyEnumMonth,
			Date:     fmt.Sprintf("%s-01", *date),
		}
	case len(*date) == 10:
		return &models.FuzzyDate{
			Accuracy: models.DateAccuracyEnumDay,
			Date:     *date,
		}
	}

	return nil
}
