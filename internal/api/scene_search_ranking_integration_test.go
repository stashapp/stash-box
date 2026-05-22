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
	Name    string `yaml:"name"`
	Term    string `yaml:"term"`
	Expect  string `yaml:"expect"`
	MaxRank int    `yaml:"max_rank"`
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
			rank := -1
			for i, sc := range scenes {
				if sc.ID == expectedID {
					rank = i
					break
				}
			}
			if !assert.GreaterOrEqual(t, rank, 0, "expected scene %s missing from results for query %q", q.Expect, q.Term) {
				return
			}
			assert.LessOrEqual(t, rank, q.MaxRank,
				"expected scene %s to rank within %d for query %q, got rank %d",
				q.Expect, q.MaxRank, q.Term, rank)
		})
	}
}
