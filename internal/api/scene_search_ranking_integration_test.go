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

type rankingPerformer struct {
	ID      string   `yaml:"id"`
	Name    string   `yaml:"name"`
	Aliases []string `yaml:"aliases"`
}

type rankingStudio struct {
	ID      string   `yaml:"id"`
	Name    string   `yaml:"name"`
	Aliases []string `yaml:"aliases"`
	Parent  string   `yaml:"parent"`
}

type rankingScenePerformer struct {
	ID string `yaml:"id"`
	As string `yaml:"as,omitempty"`
}

// Accepts either a bare string (just the performer id) or a mapping
// ({id: ..., as: ...}), so simple cases stay compact.
func (p *rankingScenePerformer) UnmarshalYAML(value *yaml.Node) error {
	if value.Kind == yaml.ScalarNode {
		p.ID = value.Value
		return nil
	}
	type raw rankingScenePerformer
	return value.Decode((*raw)(p))
}

type rankingScene struct {
	ID         string                  `yaml:"id"`
	Title      string                  `yaml:"title"`
	Date       string                  `yaml:"date"`
	Code       string                  `yaml:"code"`
	Studio     string                  `yaml:"studio"`
	Performers []rankingScenePerformer `yaml:"performers"`
}

type rankingQuery struct {
	Name   string `yaml:"name"`
	Term   string `yaml:"term"`
	Expect string `yaml:"expect"`
	// MaxRank is the worst (0-based) position the expected scene may occupy.
	MaxRank int `yaml:"max_rank"`
	// Outranks lists scene ids that must rank strictly below the expected scene
	// (or be absent from the results). Used for relative-ordering regressions
	// that an absolute rank can't express, e.g. a multi-token match must beat a
	// scene matching only a single rare token.
	Outranks []string `yaml:"outranks"`
}

type rankingFixture struct {
	Performers []rankingPerformer `yaml:"performers"`
	Studios    []rankingStudio    `yaml:"studios"`
	Scenes     []rankingScene     `yaml:"scenes"`
	Queries    []rankingQuery     `yaml:"queries"`
}

func loadRankingFixture(t *testing.T, path string) *rankingFixture {
	t.Helper()
	data, err := os.ReadFile(path)
	assert.NoError(t, err, "reading fixture %s", path)
	var f rankingFixture
	assert.NoError(t, yaml.Unmarshal(data, &f), "parsing fixture %s", path)
	return &f
}

// TestSceneSearchRankingRegressions seeds a small corpus from a YAML fixture
// and runs a set of query-vs-expected-rank assertions. Add new failure modes
// by editing testdata/scene_search_corpus.yml, not by changing this file.
func TestSceneSearchRankingRegressions(t *testing.T) {
	fixture := loadRankingFixture(t, "testdata/scene_search_corpus.yml")
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

	studioIDs := make(map[string]uuid.UUID, len(fixture.Studios))
	for _, s := range fixture.Studios {
		input := &models.StudioCreateInput{
			Name:    s.Name,
			Aliases: s.Aliases,
		}
		if s.Parent != "" {
			parentID, ok := studioIDs[s.Parent]
			if !assert.True(t, ok, "studio %s references unknown parent %s (must be declared first)", s.ID, s.Parent) {
				t.FailNow()
			}
			input.ParentID = &parentID
		}
		out, err := runner.createTestStudio(input)
		if !assert.NoError(t, err, "creating studio %s", s.ID) || out == nil {
			t.FailNow()
		}
		studioIDs[s.ID] = out.UUID()
	}

	sceneIDs := make(map[string]uuid.UUID, len(fixture.Scenes))
	for _, sc := range fixture.Scenes {
		studioID, ok := studioIDs[sc.Studio]
		if !assert.True(t, ok, "scene %s references unknown studio %s", sc.ID, sc.Studio) {
			t.FailNow()
		}

		performers := make([]models.PerformerAppearanceInput, 0, len(sc.Performers))
		for _, pref := range sc.Performers {
			pid, ok := performerIDs[pref.ID]
			if !assert.True(t, ok, "scene %s references unknown performer %s", sc.ID, pref.ID) {
				t.FailNow()
			}
			app := models.PerformerAppearanceInput{PerformerID: pid}
			if pref.As != "" {
				as := pref.As
				app.As = &as
			}
			performers = append(performers, app)
		}

		title := sc.Title
		input := &models.SceneCreateInput{
			Title:      &title,
			Date:       sc.Date,
			StudioID:   &studioID,
			Performers: performers,
		}
		if sc.Code != "" {
			code := sc.Code
			input.Code = &code
		}
		out, err := runner.createTestScene(input)
		if !assert.NoError(t, err, "creating scene %s", sc.ID) || out == nil {
			t.FailNow()
		}
		sceneIDs[sc.ID] = out.UUID()
	}

	// Remove the corpus once the assertions are done so it can't surface in
	// other tests' searches. Scenes are soft-deleted (which drops them from
	// scene_search); performers and studios are hard-deleted. Best-effort and
	// order-independent — distinctive names make any stray leftover harmless,
	// and the suite drops all tables on exit regardless.
	t.Cleanup(func() {
		for _, id := range sceneIDs {
			_, _ = runner.client.destroyScene(models.SceneDestroyInput{ID: id})
		}
		for _, id := range performerIDs {
			_, _ = runner.resolver.Mutation().PerformerDestroy(runner.ctx, models.PerformerDestroyInput{ID: id})
		}
		for _, id := range studioIDs {
			_, _ = runner.resolver.Mutation().StudioDestroy(runner.ctx, models.StudioDestroyInput{ID: id})
		}
	})

	for _, q := range fixture.Queries {
		q := q
		t.Run(q.Name, func(t *testing.T) {
			result, err := runner.resolver.Query().SearchScenes(runner.ctx, q.Term, nil, nil, nil)
			assert.NoError(t, err, "running query %q", q.Term)

			expectedID, ok := sceneIDs[q.Expect]
			if !assert.True(t, ok, "query references unknown scene id %s", q.Expect) {
				return
			}

			scenes := result.SearchResults.Scenes
			rankOf := func(id uuid.UUID) int {
				for i, sc := range scenes {
					if sc.ID == id {
						return i
					}
				}
				return -1
			}

			rank := rankOf(expectedID)
			if !assert.GreaterOrEqual(t, rank, 0, "expected scene %s missing from results for query %q", q.Expect, q.Term) {
				return
			}
			assert.LessOrEqual(t, rank, q.MaxRank,
				"expected scene %s to rank within %d for query %q, got rank %d",
				q.Expect, q.MaxRank, q.Term, rank)

			for _, belowID := range q.Outranks {
				lowerID, ok := sceneIDs[belowID]
				if !assert.True(t, ok, "query references unknown outranked scene id %s", belowID) {
					continue
				}
				lowerRank := rankOf(lowerID)
				// -1 (absent) is fine: ranking below everything satisfies the constraint.
				if lowerRank >= 0 {
					assert.Less(t, rank, lowerRank,
						"expected scene %s to outrank %s for query %q, got ranks %d vs %d",
						q.Expect, belowID, q.Term, rank, lowerRank)
				}
			}
		})
	}
}
