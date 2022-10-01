package models

import (
	"database/sql"
	"testing"

	"github.com/gofrs/uuid"
	"gotest.tools/v3/assert"
)

func TestCopyFromTagEdit(t *testing.T) {
	input := TagEdit{
		Name:        &bName,
		Description: &bDescription,
		CategoryID:  &bCategoryID,
	}

	old := TagEdit{
		Name:        &aName,
		Description: &aDescription,
		CategoryID:  &aCategoryID,
	}

	orig := Tag{
		Name:        aName,
		Description: sql.NullString{String: aDescription, Valid: true},
		CategoryID:  uuid.NullUUID{UUID: aCategoryID, Valid: true},
	}

	origCopy := orig
	origCopy.CopyFromTagEdit(input, &old)

	assert.DeepEqual(t, Tag{
		Name:        bName,
		Description: sql.NullString{String: bDescription, Valid: true},
		CategoryID:  uuid.NullUUID{UUID: bCategoryID, Valid: true},
	}, origCopy)

	origCopy = orig
	origCopy.CopyFromTagEdit(TagEdit{}, &TagEdit{})

	assert.DeepEqual(t, orig, origCopy)
}
