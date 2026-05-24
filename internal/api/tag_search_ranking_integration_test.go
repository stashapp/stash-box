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

type rankingTag struct {
	ID      string   `yaml:"id"`
	Name    string   `yaml:"name"`
	Aliases []string `yaml:"aliases"`
}

type rankingTagQuery struct {
	Name      string `yaml:"name"`
	Term      string `yaml:"term"`
	Expect    string `yaml:"expect"`
	NotExpect string `yaml:"not_expect"`
	MaxRank   int    `yaml:"max_rank"`
}

type rankingTagFixture struct {
	Tags    []rankingTag      `yaml:"tags"`
	Queries []rankingTagQuery `yaml:"queries"`
}

func loadRankingTagFixture(t *testing.T, path string) *rankingTagFixture {
	t.Helper()
	data, err := os.ReadFile(path)
	assert.NoError(t, err, "reading fixture %s", path)
	var f rankingTagFixture
	assert.NoError(t, yaml.Unmarshal(data, &f), "parsing fixture %s", path)
	return &f
}

// TestTagSearchRankingRegressions seeds tags from a YAML fixture and asserts
// presence/absence per query. Add new failure modes by editing
// testdata/tag_search_corpus.yml, not by changing this file.
func TestTagSearchRankingRegressions(t *testing.T) {
	fixture := loadRankingTagFixture(t, "testdata/tag_search_corpus.yml")
	runner := createSearchTestRunner(t)

	tagIDs := make(map[string]uuid.UUID, len(fixture.Tags))
	for _, tg := range fixture.Tags {
		out, err := runner.createTestTag(&models.TagCreateInput{
			Name:    tg.Name,
			Aliases: tg.Aliases,
		})
		if !assert.NoError(t, err, "creating tag %s", tg.ID) || out == nil {
			t.FailNow()
		}
		tagIDs[tg.ID] = out.UUID()
	}

	for _, q := range fixture.Queries {
		q := q
		t.Run(q.Name, func(t *testing.T) {
			if (q.Expect == "") == (q.NotExpect == "") {
				t.Fatalf("query %q must set exactly one of expect / not_expect", q.Name)
			}

			tags, err := runner.resolver.Query().SearchTag(runner.ctx, q.Term, nil)
			assert.NoError(t, err, "running query %q", q.Term)

			if q.Expect != "" {
				targetID, ok := tagIDs[q.Expect]
				if !assert.True(t, ok, "query references unknown tag id %s", q.Expect) {
					return
				}
				rank := -1
				for i, tg := range tags {
					if tg.ID == targetID {
						rank = i
						break
					}
				}
				if !assert.GreaterOrEqual(t, rank, 0, "expected tag %s missing from results for query %q", q.Expect, q.Term) {
					return
				}
				assert.LessOrEqual(t, rank, q.MaxRank,
					"expected tag %s to rank within %d for query %q, got rank %d",
					q.Expect, q.MaxRank, q.Term, rank)
				return
			}

			targetID, ok := tagIDs[q.NotExpect]
			if !assert.True(t, ok, "query references unknown tag id %s", q.NotExpect) {
				return
			}
			for _, tg := range tags {
				assert.NotEqual(t, targetID, tg.ID,
					"tag %s unexpectedly returned for query %q", q.NotExpect, q.Term)
			}
		})
	}
}
