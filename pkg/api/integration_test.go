// +build integration

package api_test

import (
	"context"
	"strconv"
	"testing"

	"github.com/stashapp/stashdb/pkg/api"
	dbtest "github.com/stashapp/stashdb/pkg/database/databasetest"
	"github.com/stashapp/stashdb/pkg/models"

	"github.com/99designs/gqlgen/graphql"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
)

func TestMain(m *testing.M) {
	dbtest.TestWithDatabase(m, nil)
}

type testRunner struct {
	t        *testing.T
	resolver api.Resolver
	ctx      context.Context
	err      error
}

var performerSuffix int
var studioSuffix int
var tagSuffix int
var sceneChecksumSuffix int

func createTestRunner(t *testing.T) *testRunner {
	resolver := api.Resolver{}
	ctx := context.TODO()
	ctx = context.WithValue(ctx, api.ContextRole, api.ModifyRole)

	return &testRunner{
		t:        t,
		resolver: resolver,
		ctx:      ctx,
	}
}

func (t *testRunner) doTest(test func()) {
	if t.t.Failed() {
		return
	}

	test()
}

func (t *testRunner) fieldMismatch(expected interface{}, actual interface{}, field string) {
	t.t.Helper()
	t.t.Errorf("%s mismatch: %+v != %+v", field, actual, expected)
}

func (t *testRunner) updateContext(fields []string) context.Context {
	variables := make(map[string]interface{})
	for _, v := range fields {
		variables[v] = true
	}

	rctx := &graphql.RequestContext{
		Variables: variables,
	}
	return graphql.WithRequestContext(t.ctx, rctx)
}

func (s *testRunner) generatePerformerName() string {
	performerSuffix += 1
	return "performer-" + strconv.Itoa(performerSuffix)
}

func (s *testRunner) createTestPerformer(input *models.PerformerCreateInput) (*models.Performer, error) {
	if input == nil {
		input = &models.PerformerCreateInput{
			Name: s.generatePerformerName(),
		}
	}

	createdPerformer, err := s.resolver.Mutation().PerformerCreate(s.ctx, *input)

	if err != nil {
		s.t.Errorf("Error creating performer: %s", err.Error())
		return nil, err
	}

	return createdPerformer, nil
}

func (s *testRunner) generateStudioName() string {
	studioSuffix += 1
	return "studio-" + strconv.Itoa(studioSuffix)
}

func (s *testRunner) createTestStudio(input *models.StudioCreateInput) (*models.Studio, error) {
	if input == nil {
		input = &models.StudioCreateInput{
			Name: s.generateStudioName(),
		}
	}

	createdStudio, err := s.resolver.Mutation().StudioCreate(s.ctx, *input)

	if err != nil {
		s.t.Errorf("Error creating studio: %s", err.Error())
		return nil, err
	}

	return createdStudio, nil
}

func (s *testRunner) generateTagName() string {
	tagSuffix += 1
	return "tag-" + strconv.Itoa(tagSuffix)
}

func (s *testRunner) createTestTag(input *models.TagCreateInput) (*models.Tag, error) {
	if input == nil {
		input = &models.TagCreateInput{
			Name: s.generateTagName(),
		}
	}

	createdTag, err := s.resolver.Mutation().TagCreate(s.ctx, *input)

	if err != nil {
		s.t.Errorf("Error creating tag: %s", err.Error())
		return nil, err
	}

	return createdTag, nil
}

func (s *testRunner) createTestScene(input *models.SceneCreateInput) (*models.Scene, error) {
	if input == nil {
		title := "title"
		input = &models.SceneCreateInput{
			Title: &title,
			Checksums: []string{
				s.generateSceneChecksum(),
			},
		}
	}

	createdScene, err := s.resolver.Mutation().SceneCreate(s.ctx, *input)

	if err != nil {
		s.t.Errorf("Error creating scene: %s", err.Error())
		return nil, err
	}

	return createdScene, nil
}

func (s *testRunner) generateSceneChecksum() string {
	sceneChecksumSuffix += 1
	return "scene-" + strconv.Itoa(sceneChecksumSuffix)
}

func oneNil(l interface{}, r interface{}) bool {
	return l != r && (l == nil || r == nil)
}

func bothNil(l interface{}, r interface{}) bool {
	return l == nil && r == nil
}
