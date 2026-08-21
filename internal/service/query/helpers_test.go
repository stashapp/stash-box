package query

import (
	"testing"

	sq "github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/assert"
)

func TestNormalizePage(t *testing.T) {
	tests := []struct {
		name string
		in   int
		want int
	}{
		{"negative defaults", -1, 1},
		{"zero defaults", 0, 1},
		{"min", 1, 1},
		{"greater", 2, 2},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, NormalizePage(tt.in))
		})
	}
}

func TestNormalizePerPage(t *testing.T) {
	tests := []struct {
		name string
		in   int
		want int
	}{
		{"negative defaults", -1, 25},
		{"zero defaults", 0, 25},
		{"min", 1, 1},
		{"default", 25, 25},
		{"at max", 100, 100},
		{"above max", 101, 100},
		{"far above max", 1000, 100},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, NormalizePerPage(tt.in))
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
