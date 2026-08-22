package query

import (
	"testing"

	sq "github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/assert"
)

func TestPagination(t *testing.T) {
	tests := []struct {
		name       string
		page       int
		perPage    int
		wantLimit  int32
		wantOffset int32
	}{
		{"negative page defaults", -1, 25, 25, 0},
		{"zero page defaults", 0, 25, 25, 0},
		{"page one offset zero", 1, 40, 40, 0},
		{"page two offset", 2, 40, 40, 40},
		{"negative per page defaults", 1, -1, 25, 0},
		{"zero per page defaults", 1, 0, 25, 0},
		{"per page at max", 1, 100, 100, 0},
		{"per page above max", 1, 101, 100, 0},
		{"per page far above max", 1, 1000, 100, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := Pagination(tt.page, tt.perPage)
			assert.Equal(t, tt.wantLimit, p.Limit)
			assert.Equal(t, tt.wantOffset, p.Offset)
		})
	}
}

func TestApplyPaginationNormalizes(t *testing.T) {
	q := sq.Select("scenes.*").From("scenes")

	sql, _, err := ApplyPagination(q, 1, 500).ToSql()
	assert.NoError(t, err)
	assert.Contains(t, sql, "LIMIT 100")
	assert.Contains(t, sql, "OFFSET 0")

	sql, _, err = ApplyPagination(q, 2, 40).ToSql()
	assert.NoError(t, err)
	assert.Contains(t, sql, "LIMIT 40")
	assert.Contains(t, sql, "OFFSET 40")

	// Unset per_page defaults to 25.
	sql, _, err = ApplyPagination(q, 1, 0).ToSql()
	assert.NoError(t, err)
	assert.Contains(t, sql, "LIMIT 25")

	// Unset page defaults to 1 (offset 0).
	sql, _, err = ApplyPagination(q, 0, 40).ToSql()
	assert.NoError(t, err)
	assert.Contains(t, sql, "LIMIT 40")
	assert.Contains(t, sql, "OFFSET 0")
}
