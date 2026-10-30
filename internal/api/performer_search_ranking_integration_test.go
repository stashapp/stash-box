//go:build integration

package api_test

import (
	"os"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	performerservice "github.com/stashapp/stash-box/internal/service/performer"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

type rankingPerformerQuery struct {
	Name      string   `yaml:"name"`
	Term      string   `yaml:"term"`
	Expect    string   `yaml:"expect"`
	NotExpect string   `yaml:"not_expect"`
	MaxRank   int      `yaml:"max_rank"`
	Outranks  []string `yaml:"outranks"`
}

type rankingPerformerFixture struct {
	Performers []rankingPerformer      `yaml:"performers"`
	Queries    []rankingPerformerQuery `yaml:"queries"`
}

func loadRankingPerformerFixture(t *testing.T, path string) *rankingPerformerFixture {
	t.Helper()
	data, err := os.ReadFile(path)
	assert.NoError(t, err, "reading fixture %s", path)
	var f rankingPerformerFixture
	assert.NoError(t, yaml.Unmarshal(data, &f), "parsing fixture %s", path)
	return &f
}

// TestPerformerSearchRankingRegressions seeds a small corpus from a YAML
// fixture and runs presence/absence/rank assertions against SearchPerformers.
// Add new failure modes by editing testdata/performer_search_corpus.yml, not
// by changing this file.
func TestPerformerSearchRankingRegressions(t *testing.T) {
	fixture := loadRankingPerformerFixture(t, "testdata/performer_search_corpus.yml")
	runner := createSearchTestRunner(t)

	performerIDs := make(map[string]uuid.UUID, len(fixture.Performers))
	for _, p := range fixture.Performers {
		out, err := runner.createTestPerformer(&models.PerformerCreateInput{
			Name:    p.Name,
			Aliases: p.Aliases,
		})
		if !assert.NoError(t, err, "creating performer %s", p.ID) || out == nil {
			t.FailNow()
		}
		performerIDs[p.ID] = out.UUID()
	}

	t.Cleanup(func() {
		for _, id := range performerIDs {
			_, _ = runner.resolver.Mutation().PerformerDestroy(runner.ctx, models.PerformerDestroyInput{ID: id})
		}
	})

	for _, q := range fixture.Queries {
		t.Run(q.Name, func(t *testing.T) {
			if (q.Expect == "") == (q.NotExpect == "") {
				t.Fatalf("query %q must set exactly one of expect / not_expect", q.Name)
			}

			result, err := runner.resolver.Query().SearchPerformers(runner.ctx, q.Term, nil, nil, nil, nil)
			if !assert.NoError(t, err, "running query %q", q.Term) {
				return
			}

			performers, err := runner.resolver.QueryPerformersResultType().Performers(runner.ctx, result)
			if !assert.NoError(t, err, "resolving performers for query %q", q.Term) {
				return
			}
			rankOf := func(id uuid.UUID) int {
				for i, p := range performers {
					if p.ID == id {
						return i
					}
				}
				return -1
			}

			if q.NotExpect != "" {
				targetID, ok := performerIDs[q.NotExpect]
				if !assert.True(t, ok, "query references unknown performer id %s", q.NotExpect) {
					return
				}
				assert.Equal(t, -1, rankOf(targetID),
					"performer %s unexpectedly returned for query %q", q.NotExpect, q.Term)
				return
			}

			expectedID, ok := performerIDs[q.Expect]
			if !assert.True(t, ok, "query references unknown performer id %s", q.Expect) {
				return
			}

			rank := rankOf(expectedID)
			if !assert.GreaterOrEqual(t, rank, 0, "expected performer %s missing from results for query %q", q.Expect, q.Term) {
				return
			}
			assert.LessOrEqual(t, rank, q.MaxRank,
				"expected performer %s to rank within %d for query %q, got rank %d",
				q.Expect, q.MaxRank, q.Term, rank)

			for _, belowID := range q.Outranks {
				lowerID, ok := performerIDs[belowID]
				if !assert.True(t, ok, "query references unknown outranked performer id %s", belowID) {
					continue
				}
				lowerRank := rankOf(lowerID)
				// -1 (absent) is fine: ranking below everything satisfies the constraint.
				if lowerRank >= 0 {
					assert.Less(t, rank, lowerRank,
						"expected performer %s to outrank %s for query %q, got ranks %d vs %d",
						q.Expect, belowID, q.Term, rank, lowerRank)
				}
			}
		})
	}
}

func TestPerformerSearchWithGenericSessionPlan(t *testing.T) {
	runner := createSearchTestRunner(t)
	ids := make(map[models.GenderEnum]uuid.UUID)
	for _, gender := range []models.GenderEnum{models.GenderEnumFemale, models.GenderEnumMale} {
		p, err := runner.createTestPerformer(&models.PerformerCreateInput{
			Name:    "PlanProbePerformers " + string(gender),
			Aliases: []string{"PlanProbeAlias"},
			Gender:  &gender,
		})
		require.NoError(t, err)
		id := p.UUID()
		ids[gender] = id
		t.Cleanup(func() {
			_, _ = runner.resolver.Mutation().PerformerDestroy(runner.ctx, models.PerformerDestroyInput{ID: id})
		})
	}

	connString := os.Getenv("POSTGRES_DB")
	if connString == "" {
		connString = "postgres@localhost/stash-box-test?sslmode=disable"
	}
	conn, err := pgx.Connect(runner.ctx, "postgres://"+connString)
	require.NoError(t, err)
	defer conn.Close(runner.ctx)
	_, err = conn.Exec(runner.ctx, "SET plan_cache_mode = force_generic_plan")
	require.NoError(t, err)

	// Keep all queries on one connection. The service must override generic
	// planning inside each search transaction without changing the session.
	search := performerservice.NewPerformer(queries.New(conn), func(fn func(*queries.Queries) error) error {
		return pgx.BeginFunc(runner.ctx, conn, func(tx pgx.Tx) error {
			return fn(queries.New(tx))
		})
	})
	female, male := string(models.GenderEnumFemale), string(models.GenderEnumMale)
	for _, tc := range []struct {
		name    string
		term    string
		gender  *string
		genders []models.GenderEnum
	}{
		{"unfiltered", "PlanProbePerformers", nil, []models.GenderEnum{models.GenderEnumFemale, models.GenderEnumMale}},
		{"female", "PlanProbePerformers", &female, []models.GenderEnum{models.GenderEnumFemale}},
		{"male", "PlanProbePerformers", &male, []models.GenderEnum{models.GenderEnumMale}},
		{"alias", "PlanProbeAlias", nil, []models.GenderEnum{models.GenderEnumFemale, models.GenderEnumMale}},
		{"no matches", "PlanProbeMissing398217", nil, nil},
	} {
		t.Run(tc.name, func(t *testing.T) {
			params := &models.PerformerSearchParams{Term: tc.term, FilterGender: tc.gender, Limit: 25}
			var expectedIDs []uuid.UUID
			var expectedFacets []models.GenderFacet
			for _, gender := range tc.genders {
				expectedIDs = append(expectedIDs, ids[gender])
				expectedFacets = append(expectedFacets, models.GenderFacet{Gender: gender, Count: 1})
			}
			for range 6 {
				page, err := search.SearchPerformerPage(runner.ctx, params)
				require.NoError(t, err)
				var actualIDs []uuid.UUID
				for _, p := range page {
					actualIDs = append(actualIDs, p.ID)
				}
				assert.ElementsMatch(t, expectedIDs, actualIDs)
				count, err := search.SearchPerformerCount(runner.ctx, params)
				require.NoError(t, err)
				assert.Equal(t, len(expectedIDs), count)
				facets, err := search.SearchPerformerFacets(runner.ctx, params)
				require.NoError(t, err)
				assert.ElementsMatch(t, expectedFacets, facets.Genders)
			}
			var mode string
			require.NoError(t, conn.QueryRow(runner.ctx, "SHOW plan_cache_mode").Scan(&mode))
			assert.Equal(t, "force_generic_plan", mode)
		})
	}
}
