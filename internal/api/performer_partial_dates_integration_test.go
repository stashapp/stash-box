//go:build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/require"
)

func TestQueryPerformersPartialDates(t *testing.T) {
	s := createPerformerTestRunner(t)
	prefix := s.generatePerformerName()
	dates := []string{"1989-12-31", "1990", "1990-01", "1990-01-01", "1990-01-02", "1990-02", "1991", "2000-02", "2000-02-29", "2000-03-01"}
	ids := make(map[string]string)
	for _, date := range dates {
		p, err := s.createTestPerformer(&models.PerformerCreateInput{
			Name: prefix + " " + date, Birthdate: &date, Deathdate: &date,
		})
		require.NoError(t, err)
		ids[date] = p.ID
	}
	missing, err := s.createTestPerformer(&models.PerformerCreateInput{Name: prefix + " unknown"})
	require.NoError(t, err)

	cases := []struct {
		name     string
		value    string
		modifier models.CriterionModifier
		matches  []string
	}{
		{"before year boundary", "1990-01-01", models.CriterionModifierLessThan, []string{"1989-12-31"}},
		{"after year boundary", "1990-01-01", models.CriterionModifierGreaterThan, []string{"1990-01-02", "1990-02", "1991", "2000-02", "2000-02-29", "2000-03-01"}},
		{"overlapping dates", "1990-01-01", models.CriterionModifierEquals, []string{"1990", "1990-01", "1990-01-01"}},
		{"nonoverlapping dates", "1990-01-01", models.CriterionModifierNotEquals, []string{"1989-12-31", "1990-01-02", "1990-02", "1991", "2000-02", "2000-02-29", "2000-03-01"}},
		{"whole year", "1990", models.CriterionModifierEquals, []string{"1990", "1990-01", "1990-01-01", "1990-01-02", "1990-02"}},
		{"after whole year", "1990", models.CriterionModifierGreaterThan, []string{"1991", "2000-02", "2000-02-29", "2000-03-01"}},
		{"before whole month", "1990-02", models.CriterionModifierLessThan, []string{"1989-12-31", "1990-01", "1990-01-01", "1990-01-02"}},
		{"leap day", "2000-02-29", models.CriterionModifierEquals, []string{"2000-02", "2000-02-29"}},
		{"after leap day", "2000-02-29", models.CriterionModifierGreaterThan, []string{"2000-03-01"}},
		{"unpopulated", "", models.CriterionModifierIsNull, nil},
		{"populated", "", models.CriterionModifierNotNull, dates},
	}
	for _, field := range []string{"birthdate", "deathdate"} {
		for _, tc := range cases {
			t.Run(field+"/"+tc.name, func(t *testing.T) {
				criterion := &models.DateCriterionInput{Value: tc.value, Modifier: tc.modifier}
				input := models.PerformerQueryInput{Names: &prefix, Page: 1, PerPage: 100, Sort: models.PerformerSortEnumName, Direction: models.SortDirectionEnumAsc}
				if field == "birthdate" {
					input.Birthdate = criterion
				} else {
					input.Deathdate = criterion
				}
				result, err := s.client.queryPerformers(input)
				require.NoError(t, err)
				found := make(map[string]bool)
				for _, p := range result.Performers {
					found[p.ID] = true
				}
				expected := make(map[string]bool)
				for _, date := range tc.matches {
					expected[date] = true
				}
				for _, date := range dates {
					require.Equal(t, expected[date], found[ids[date]], "date %s", date)
				}
				require.Equal(t, tc.modifier == models.CriterionModifierIsNull, found[missing.ID], "missing date")
			})
		}
	}
}
