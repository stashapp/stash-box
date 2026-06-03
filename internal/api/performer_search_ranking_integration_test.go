//go:build integration

package api_test

import (
	"os"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
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
		q := q
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
