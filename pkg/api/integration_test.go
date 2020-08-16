// +build integration

package api_test

import (
	"context"
	"strconv"
	"testing"

	"github.com/stashapp/stashdb/pkg/api"
	"github.com/stashapp/stashdb/pkg/database"
	dbtest "github.com/stashapp/stashdb/pkg/database/databasetest"
	"github.com/stashapp/stashdb/pkg/manager"
	"github.com/stashapp/stashdb/pkg/models"

	"github.com/99designs/gqlgen/graphql"
)

// we need to create some users to test the api with, otherwise all calls
// will be unauthorised
type userPopulator struct {
	none        *models.User
	read        *models.User
	admin       *models.User
	modify      *models.User
	noneRolls   []models.RoleEnum
	readRoles   []models.RoleEnum
	adminRoles  []models.RoleEnum
	modifyRoles []models.RoleEnum
}

var userDB *userPopulator

func (p *userPopulator) PopulateDB() error {
	ctx := context.TODO()
	tx := database.DB.MustBeginTx(ctx, nil)

	// create admin user
	createInput := models.UserCreateInput{
		Name: "admin",
		Roles: []models.RoleEnum{
			models.RoleEnumAdmin,
		},
		Email: "admin",
	}

	var err error
	p.admin, err = manager.UserCreate(tx, createInput)
	p.adminRoles = createInput.Roles

	if err != nil {
		_ = tx.Rollback()
		return err
	}

	// create modify user
	createInput = models.UserCreateInput{
		Name: "modify",
		Roles: []models.RoleEnum{
			models.RoleEnumModify,
		},
		Email: "modify",
	}

	p.modify, err = manager.UserCreate(tx, createInput)
	p.modifyRoles = createInput.Roles

	if err != nil {
		_ = tx.Rollback()
		return err
	}

	// create read user
	createInput = models.UserCreateInput{
		Name: "read",
		Roles: []models.RoleEnum{
			models.RoleEnumRead,
		},
		Email: "read",
	}

	p.read, err = manager.UserCreate(tx, createInput)
	p.readRoles = createInput.Roles

	if err != nil {
		_ = tx.Rollback()
		return err
	}

	// create none user
	createInput = models.UserCreateInput{
		Name: "none",
		Roles: []models.RoleEnum{
			models.RoleEnumRead,
		},
		Email: "none",
	}

	p.none, err = manager.UserCreate(tx, createInput)

	if err != nil {
		_ = tx.Rollback()
		return err
	}

	// create other users as needed

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func TestMain(m *testing.M) {
	userDB = &userPopulator{}
	dbtest.TestWithDatabase(m, userDB)
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
var userSuffix int

func createTestRunner(t *testing.T, user *models.User, roles []models.RoleEnum) *testRunner {
	resolver := api.Resolver{}

	// replicate what the server.go code does
	ctx := context.TODO()
	ctx = context.WithValue(ctx, api.ContextUser, user)
	ctx = context.WithValue(ctx, api.ContextRoles, roles)

	return &testRunner{
		t:        t,
		resolver: resolver,
		ctx:      ctx,
	}
}

func asAdmin(t *testing.T) *testRunner {
	return createTestRunner(t, userDB.admin, userDB.adminRoles)
}

func asModify(t *testing.T) *testRunner {
	return createTestRunner(t, userDB.modify, userDB.modifyRoles)
}

func asRead(t *testing.T) *testRunner {
	return createTestRunner(t, userDB.read, userDB.readRoles)
}

func asNone(t *testing.T) *testRunner {
	return createTestRunner(t, userDB.none, userDB.noneRolls)
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
	s.t.Helper()
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
	s.t.Helper()
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
	s.t.Helper()
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
	s.t.Helper()
	if input == nil {
		title := "title"
		input = &models.SceneCreateInput{
			Title: &title,
			Fingerprints: []*models.FingerprintInput{
				s.generateSceneFingerprint(),
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

func (s *testRunner) generateSceneFingerprint() *models.FingerprintInput {
	sceneChecksumSuffix += 1
	return &models.FingerprintInput{
		Algorithm: "MD5",
		Hash:      "scene-" + strconv.Itoa(sceneChecksumSuffix),
		Duration:  1234,
	}
}

func (s *testRunner) generateUserName() string {
	userSuffix += 1
	return "user-" + strconv.Itoa(userSuffix)
}

func (s *testRunner) createTestUser(input *models.UserCreateInput) (*models.User, error) {
	s.t.Helper()

	if input == nil {
		name := s.generateUserName()
		input = &models.UserCreateInput{
			Name:     name,
			Email:    name + "@example.com",
			Password: "password" + name,
			Roles: []models.RoleEnum{
				models.RoleEnumAdmin,
			},
		}
	}

	createdUser, err := s.resolver.Mutation().UserCreate(s.ctx, *input)

	if err != nil {
		s.t.Errorf("Error creating user: %s", err.Error())
		return nil, err
	}

	return createdUser, nil
}

func (s *testRunner) createTestTagEdit(operation models.OperationEnum, detailsInput *models.TagEditDetailsInput, editInput *models.EditInput) (*models.Edit, error) {
	s.t.Helper()

	if editInput == nil {
		input := models.EditInput{
			Operation: operation,
		}
		editInput = &input
	}

	if detailsInput == nil {
		name := s.generateTagName()
		input := models.TagEditDetailsInput{
			Name: &name,
		}
		detailsInput = &input
	}

	tagEditInput := models.TagEditInput{
		Edit:    editInput,
		Details: detailsInput,
	}

	createdEdit, err := s.resolver.Mutation().TagEdit(s.ctx, tagEditInput)

	if err != nil {
		s.t.Errorf("Error creating edit: %s", err.Error())
		return nil, err
	}

	return createdEdit, nil
}

func (s *testRunner) applyEdit(id string) (*models.Edit, error) {
	s.t.Helper()

  input := models.ApplyEditInput{
    ID: id,
  }
	appliedEdit, err := s.resolver.Mutation().ApplyEdit(s.ctx, input)

	if err != nil {
		s.t.Errorf("Error applying edit: %s", err.Error())
		return nil, err
	}

	return appliedEdit, nil
}

func (s *testRunner) getEditTagDetails(input *models.Edit) *models.TagEdit {
	s.t.Helper()
	r := s.resolver.Edit()

	details, _ := r.Details(s.ctx, input)
	tagDetails := details.(*models.TagEdit)
	return tagDetails
}

func (s *testRunner) getEditTagTarget(input *models.Edit) *models.Tag {
	s.t.Helper()
	r := s.resolver.Edit()

	target, _ := r.Target(s.ctx, input)
	tagTarget := target.(*models.Tag)
	return tagTarget
}

func compareUrls(input []*models.URLInput, urls []*models.URL) bool {
	if len(urls) != len(input) {
		return false
	}

	for i, v := range urls {
		if v.URL != input[i].URL || v.Type != input[i].Type {
			return false
		}
	}

	return true
}

func oneNil(l interface{}, r interface{}) bool {
	return l != r && (l == nil || r == nil)
}

func bothNil(l interface{}, r interface{}) bool {
	return l == nil && r == nil
}
