//go:build integration

package api_test

import (
	"context"
	"net/http"
	"strconv"
	"testing"

	"github.com/stashapp/stash-box/internal/api"
	"github.com/stashapp/stash-box/internal/auth"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/service"

	"github.com/99designs/gqlgen/client"
	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
)

// we need to create some users to test the api with, otherwise all calls
// will be unauthorised
type userPopulator struct {
	none        *models.User
	read        *models.User
	admin       *models.User
	modify      *models.User
	edit        *models.User
	noneRoles   []models.RoleEnum
	readRoles   []models.RoleEnum
	adminRoles  []models.RoleEnum
	modifyRoles []models.RoleEnum
	editRoles   []models.RoleEnum
}

var userDB *userPopulator

func (p *userPopulator) PopulateDB(factory *service.Factory) error {
	ctx := context.TODO()
	userService := factory.User()

	// create admin user
	createInput := models.UserCreateInput{
		Name:     "admin",
		Password: "TestPassword#2024",
		Roles: []models.RoleEnum{
			models.RoleEnumAdmin,
		},
		Email: "admin@example.com",
	}

	var err error
	p.admin, err = userService.Create(ctx, createInput)
	p.adminRoles = createInput.Roles

	if err != nil {
		return err
	}

	// create modify user
	createInput = models.UserCreateInput{
		Name:     "modify",
		Password: "TestPassword#2024",
		Roles: []models.RoleEnum{
			models.RoleEnumModify,
		},
		Email: "modify@example.com",
	}

	p.modify, err = userService.Create(ctx, createInput)
	p.modifyRoles = createInput.Roles

	if err != nil {
		return err
	}

	// create edit user
	createInput = models.UserCreateInput{
		Name:     "edit",
		Password: "TestPassword#2024",
		Roles: []models.RoleEnum{
			models.RoleEnumEdit,
		},
		Email: "edit@example.com",
	}

	p.edit, err = userService.Create(ctx, createInput)
	p.editRoles = createInput.Roles

	if err != nil {
		return err
	}

	// create read user
	createInput = models.UserCreateInput{
		Name:     "read",
		Password: "TestPassword#2024",
		Roles: []models.RoleEnum{
			models.RoleEnumRead,
		},
		Email: "read@example.com",
	}

	p.read, err = userService.Create(ctx, createInput)
	p.readRoles = createInput.Roles

	if err != nil {
		return err
	}

	// create none user
	createInput = models.UserCreateInput{
		Name:     "none",
		Password: "TestPassword#2024",
		Roles: []models.RoleEnum{
			models.RoleEnumRead,
		},
		Email: "none@example.com",
	}

	p.none, err = userService.Create(ctx, createInput)

	if err != nil {
		return err
	}

	// create other users as needed
	return nil
}

func TestMain(m *testing.M) {
	userDB = &userPopulator{}
	dbtest.TestWithDatabase(m, userDB)
}

type testRunner struct {
	t        *testing.T
	client   *graphqlClient
	resolver api.Resolver
	ctx      context.Context
	err      error
}

var sceneSuffix int
var performerSuffix int
var studioSuffix int
var tagSuffix int
var sceneChecksumSuffix int
var userSuffix int
var categorySuffix int
var siteSuffix int

func createTestRunner(t *testing.T, u *models.User, roles []models.RoleEnum) *testRunner {
	resolver := api.NewResolver(*dbtest.Factory())

	gqlHandler := handler.NewDefaultServer(models.NewExecutableSchema(models.Config{
		Resolvers: resolver,
		Directives: models.DirectiveRoot{
			IsUserOwner: api.IsUserOwnerDirective,
			HasRole:     api.HasRoleDirective,
		},
	}))
	var handlerFunc http.HandlerFunc = func(w http.ResponseWriter, r *http.Request) {
		// re-create context for each request
		ctx := context.TODO()
		ctx = context.WithValue(ctx, auth.ContextUser, u)
		ctx = context.WithValue(ctx, auth.ContextRoles, roles)
		ctx = context.WithValue(ctx, dataloader.GetLoadersKey(), dataloader.GetLoaders(ctx, *dbtest.Factory()))
		ctx = graphql.WithOperationContext(ctx, &graphql.OperationContext{})

		r = r.WithContext(ctx)
		gqlHandler.ServeHTTP(w, r)
	}

	c := client.New(handlerFunc)

	// replicate what the server.go code does
	ctx := context.TODO()
	ctx = context.WithValue(ctx, auth.ContextUser, u)
	ctx = context.WithValue(ctx, auth.ContextRoles, roles)
	ctx = context.WithValue(ctx, dataloader.GetLoadersKey(), dataloader.GetLoaders(ctx, *dbtest.Factory()))
	ctx = graphql.WithOperationContext(ctx, &graphql.OperationContext{})

	return &testRunner{
		t: t,
		client: &graphqlClient{
			c,
		},
		resolver: *resolver,
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
	return createTestRunner(t, userDB.none, userDB.noneRoles)
}

func asEdit(t *testing.T) *testRunner {
	return createTestRunner(t, userDB.edit, userDB.editRoles)
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

	rctx := &graphql.OperationContext{
		Variables: variables,
	}
	return graphql.WithOperationContext(t.ctx, rctx)
}

func (s *testRunner) generatePerformerName() string {
	performerSuffix += 1
	return "performer-" + strconv.Itoa(performerSuffix)
}

func (s *testRunner) createTestPerformer(input *models.PerformerCreateInput) (*performerOutput, error) {
	s.t.Helper()
	if input == nil {
		input = &models.PerformerCreateInput{
			Name: s.generatePerformerName(),
		}
	}

	createdPerformer, err := s.client.createPerformer(*input)

	if err != nil {
		s.t.Errorf("Error creating performer: %s", err.Error())
		return nil, err
	}

	return createdPerformer, nil
}

func (s *testRunner) createFullPerformerCreateInput() *models.PerformerCreateInput {
	name := s.generatePerformerName()
	disambiguation := "Dis Ambiguation"
	gender := models.GenderEnumFemale
	ethnicity := models.EthnicityEnumCaucasian
	eyecolor := models.EyeColorEnumBlue
	haircolor := models.HairColorEnumAuburn
	country := "Some Country"
	height := 160
	hip := 23
	waist := 24
	band := 25
	cup := "DD"
	breasttype := models.BreastTypeEnumNatural
	careerstart := 2019
	careerend := 2020
	tattoodesc := "Tatto Desc"
	birthdate := "2000-02-03"
	deathdate := "2024-01-02"
	site, err := s.createTestSite(nil)
	if err != nil {
		return nil
	}

	return &models.PerformerCreateInput{
		Name:           name,
		Disambiguation: &disambiguation,
		Aliases:        []string{"Alias1"},
		Gender:         &gender,
		Urls: []models.URL{
			{
				URL:    "http://example.org",
				SiteID: site.ID,
			},
		},
		Birthdate:       &birthdate,
		Deathdate:       &deathdate,
		Ethnicity:       &ethnicity,
		Country:         &country,
		EyeColor:        &eyecolor,
		HairColor:       &haircolor,
		Height:          &height,
		HipSize:         &hip,
		WaistSize:       &waist,
		BandSize:        &band,
		CupSize:         &cup,
		BreastType:      &breasttype,
		CareerStartYear: &careerstart,
		CareerEndYear:   &careerend,
		Tattoos: []models.BodyModificationInput{
			{
				Location:    "Wrist",
				Description: &tattoodesc,
			},
		},
		Piercings: []models.BodyModificationInput{
			{
				Location: "Ears",
			},
		},
	}
}

func (s *testRunner) generateStudioName() string {
	studioSuffix += 1
	return "studio-" + strconv.Itoa(studioSuffix)
}

func (s *testRunner) createTestStudio(input *models.StudioCreateInput) (*studioOutput, error) {
	s.t.Helper()
	if input == nil {
		input = &models.StudioCreateInput{
			Name: s.generateStudioName(),
		}
	}

	createdStudio, err := s.client.createStudio(*input)

	if err != nil {
		s.t.Errorf("Error creating studio: %s", err.Error())
		return nil, err
	}

	return createdStudio, nil
}

func (s *testRunner) generateTagName() string {
	tagSuffix += 1
	return "testtag" + strconv.Itoa(tagSuffix)
}

func (s *testRunner) createTestTag(input *models.TagCreateInput) (*tagOutput, error) {
	s.t.Helper()
	if input == nil {
		input = &models.TagCreateInput{
			Name: s.generateTagName(),
		}
	}

	createdTag, err := s.client.createTag(*input)

	if err != nil {
		s.t.Errorf("Error creating tag: %s", err.Error())
		return nil, err
	}

	return createdTag, nil
}

func (s *testRunner) generateSceneName() string {
	sceneSuffix += 1
	return "scene-" + strconv.Itoa(sceneSuffix)
}

func (s *testRunner) createTestScene(input *models.SceneCreateInput) (*sceneOutput, error) {
	s.t.Helper()
	if input == nil {
		title := s.generateSceneName()
		input = &models.SceneCreateInput{
			Title: &title,
			Fingerprints: []models.FingerprintEditInput{
				s.generateSceneFingerprint(nil),
			},
			Date: "2020-03-02",
		}
	}

	if input.Fingerprints == nil {
		input.Fingerprints = []models.FingerprintEditInput{}
	}

	createdScene, err := s.client.createScene(*input)

	if err != nil {
		s.t.Errorf("Error creating scene: %s", err.Error())
		return nil, err
	}

	return createdScene, nil
}

func (s *testRunner) generateSceneFingerprint(userIDs []uuid.UUID) models.FingerprintEditInput {
	return s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmMd5, userIDs)
}

func (s *testRunner) generateSceneFingerprintWithAlgorithm(algorithm models.FingerprintAlgorithm, userIDs []uuid.UUID) models.FingerprintEditInput {
	if userIDs == nil {
		userIDs = []uuid.UUID{}
	}

	sceneChecksumSuffix += 1
	return models.FingerprintEditInput{
		Algorithm: algorithm,
		Hash:      "scene-" + algorithm.String() + "-" + strconv.Itoa(sceneChecksumSuffix),
		Duration:  1234,
		UserIds:   userIDs,
	}
}

func (s *testRunner) generateUserName() string {
	userSuffix += 1
	return "user-" + strconv.Itoa(userSuffix)
}

func (s *testRunner) createTestUser(input *models.UserCreateInput, roles []models.RoleEnum) (*models.User, error) {
	s.t.Helper()

	userRoles := roles
	if roles == nil {
		userRoles = []models.RoleEnum{
			models.RoleEnumAdmin,
		}
	}

	if input == nil {
		name := s.generateUserName()
		input = &models.UserCreateInput{
			Name:     name,
			Email:    name + "@example.com",
			Password: "password" + name,
			Roles:    userRoles,
		}
	}

	createdUser, err := s.resolver.Mutation().UserCreate(s.ctx, *input)

	if err != nil {
		s.t.Errorf("Error creating user: %s", err.Error())
		return nil, err
	}

	return createdUser, nil
}

func (s *testRunner) generateCategoryName() string {
	categorySuffix += 1
	return "category-" + strconv.Itoa(categorySuffix)
}

func (s *testRunner) createTestTagCategory(input *models.TagCategoryCreateInput) (*models.TagCategory, error) {
	s.t.Helper()

	if input == nil {
		name := s.generateCategoryName()
		desc := "Description for " + name
		input = &models.TagCategoryCreateInput{
			Name:        name,
			Description: &desc,
			Group:       models.TagGroupEnumAction,
		}
	}

	createdCategory, err := s.resolver.Mutation().TagCategoryCreate(s.ctx, *input)

	if err != nil {
		s.t.Errorf("Error creating tag category: %s", err.Error())
		return nil, err
	}

	return createdCategory, nil
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

func (s *testRunner) createTestStudioEdit(operation models.OperationEnum, detailsInput *models.StudioEditDetailsInput, editInput *models.EditInput) (*models.Edit, error) {
	s.t.Helper()

	if editInput == nil {
		input := models.EditInput{
			Operation: operation,
		}
		editInput = &input
	}

	if detailsInput == nil {
		name := s.generateStudioName()
		input := models.StudioEditDetailsInput{
			Name: &name,
		}
		detailsInput = &input
	}

	studioEditInput := models.StudioEditInput{
		Edit:    editInput,
		Details: detailsInput,
	}

	createdEdit, err := s.resolver.Mutation().StudioEdit(s.ctx, studioEditInput)

	if err != nil {
		s.t.Errorf("Error creating edit: %s", err.Error())
		return nil, err
	}

	return createdEdit, nil
}

func (s *testRunner) applyEdit(id uuid.UUID) (*models.Edit, error) {
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

func (s *testRunner) getEditStudioDetails(input *models.Edit) *models.StudioEdit {
	s.t.Helper()
	r := s.resolver.Edit()

	details, _ := r.Details(s.ctx, input)
	tagDetails := details.(*models.StudioEdit)
	return tagDetails
}

func (s *testRunner) getEditStudioTarget(input *models.Edit) *models.Studio {
	s.t.Helper()
	r := s.resolver.Edit()

	target, _ := r.Target(s.ctx, input)
	tagTarget := target.(*models.Studio)
	return tagTarget
}

func oneNil(l interface{}, r interface{}) bool {
	return l != r && (l == nil || r == nil)
}

func bothNil(l interface{}, r interface{}) bool {
	return l == nil && r == nil
}

func (s *testRunner) verifyEditOperation(operation string, edit *models.Edit) {
	if edit.Operation != operation {
		s.fieldMismatch(operation, edit.Operation, "Operation")
	}
}

func (s *testRunner) verifyEditStatus(status string, edit *models.Edit) {
	if edit.Status != status {
		s.fieldMismatch(status, edit.Status, "Status")
	}
}

func (s *testRunner) verifyEditApplication(applied bool, edit *models.Edit) {
	if edit.Applied != applied {
		s.fieldMismatch(applied, edit.Applied, "Applied")
	}
}

func (s *testRunner) verifyEditTargetType(targetType string, edit *models.Edit) {
	if edit.TargetType != targetType {
		s.fieldMismatch(targetType, edit.TargetType, "TargetType")
	}
}

func (s *testRunner) verifyAppliedPerformerEdit(edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)
}

func (s *testRunner) verifyAppliedSceneEdit(edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(true, edit)
}

func (s *testRunner) createTestPerformerEdit(operation models.OperationEnum, detailsInput *models.PerformerEditDetailsInput, editInput *models.EditInput, options *models.PerformerEditOptionsInput) (*models.Edit, error) {
	s.t.Helper()

	if editInput == nil {
		input := models.EditInput{
			Operation: operation,
		}
		editInput = &input
	}

	if detailsInput == nil {
		name := s.generatePerformerName()
		input := models.PerformerEditDetailsInput{
			Name: &name,
		}
		detailsInput = &input
	}

	performerEditInput := models.PerformerEditInput{
		Edit:    editInput,
		Details: detailsInput,
		Options: options,
	}

	createdEdit, err := s.resolver.Mutation().PerformerEdit(s.ctx, performerEditInput)

	if err != nil {
		s.t.Errorf("Error creating edit: %s", err.Error())
		return nil, err
	}

	return createdEdit, nil
}

func (s *testRunner) getEditPerformerDetails(input *models.Edit) *models.PerformerEdit {
	s.t.Helper()
	r := s.resolver.Edit()

	details, _ := r.Details(s.ctx, input)
	performerDetails := details.(*models.PerformerEdit)
	return performerDetails
}

func (s *testRunner) getEditPerformerTarget(input *models.Edit) *models.Performer {
	s.t.Helper()
	r := s.resolver.Edit()

	target, _ := r.Target(s.ctx, input)
	performerTarget := target.(*models.Performer)
	return performerTarget
}

func (s *testRunner) createPerformerEditDetailsInput() *models.PerformerEditDetailsInput {
	name := s.generatePerformerName()
	disambiguation := "Dis Ambiguation"
	gender := models.GenderEnumFemale
	ethnicity := models.EthnicityEnumCaucasian
	eyecolor := models.EyeColorEnumBlue
	haircolor := models.HairColorEnumAuburn
	country := "Some Country"
	height := 160
	hip := 23
	waist := 24
	band := 25
	cup := "DD"
	breasttype := models.BreastTypeEnumNatural
	careerstart := 2019
	careerend := 2020
	tattoodesc := "Tatto Desc"
	birthdate := "2000-02-03"
	deathdate := "2024-01-02"
	site, err := s.createTestSite(nil)
	if err != nil {
		return nil
	}

	return &models.PerformerEditDetailsInput{
		Name:           &name,
		Disambiguation: &disambiguation,
		Aliases:        []string{"Alias1"},
		Gender:         &gender,
		Urls: []models.URL{
			{
				URL:    "http://example.org",
				SiteID: site.ID,
			},
		},
		Birthdate:       &birthdate,
		Deathdate:       &deathdate,
		Ethnicity:       &ethnicity,
		Country:         &country,
		EyeColor:        &eyecolor,
		HairColor:       &haircolor,
		Height:          &height,
		HipSize:         &hip,
		WaistSize:       &waist,
		BandSize:        &band,
		CupSize:         &cup,
		BreastType:      &breasttype,
		CareerStartYear: &careerstart,
		CareerEndYear:   &careerend,
		Tattoos: []models.BodyModificationInput{
			{
				Location:    "Wrist",
				Description: &tattoodesc,
			},
		},
		Piercings: []models.BodyModificationInput{
			{
				Location: "Ears",
			},
		},
	}
}

func (s *testRunner) createFullSceneCreateInput() *models.SceneCreateInput {
	title := s.generateSceneName()
	details := "Details"
	date := "2000-02-03"
	production_date := "2000-01-09"
	duration := 123
	director := "Director"
	code := "SomeCode"
	site, err := s.createTestSite(nil)
	if err != nil {
		return nil
	}

	return &models.SceneCreateInput{
		Title:   &title,
		Details: &details,
		Urls: []models.URL{
			{
				URL:    "http://example.org",
				SiteID: site.ID,
			},
		},
		Date:           date,
		ProductionDate: &production_date,
		Fingerprints: []models.FingerprintEditInput{
			s.generateSceneFingerprint(nil),
		},
		Duration: &duration,
		Director: &director,
		Code:     &code,
	}
}

func (s *testRunner) createSceneEditDetailsInput() *models.SceneEditDetailsInput {
	title := s.generateSceneName()
	details := "Details"
	date := "2000-02-03"
	production_date := "2000-01-09"
	duration := 123
	director := "Director"
	code := "SomeCode"
	site, err := s.createTestSite(nil)
	if err != nil {
		return nil
	}

	return &models.SceneEditDetailsInput{
		Title:   &title,
		Details: &details,
		Urls: []models.URL{
			{
				URL:    "http://example.org",
				SiteID: site.ID,
			},
		},
		Date:           &date,
		ProductionDate: &production_date,
		Duration:       &duration,
		Director:       &director,
		Code:           &code,
	}
}

func (s *testRunner) createFullSceneEditDetailsInput() *models.SceneEditDetailsInput {
	createdPerformer, err := s.createTestPerformer(nil)
	if err != nil {
		s.t.Errorf("Error creating performer: %s", err.Error())
		return nil
	}
	createdTag, err := s.createTestTag(nil)
	if err != nil {
		s.t.Errorf("Error creating tag: %s", err.Error())
		return nil
	}

	title := s.generateSceneName()
	details := "Details"
	date := "2000-02-03"
	production_date := "2000-01-09"
	duration := 123
	director := "Director"
	code := "SomeCode"
	as := "Alias"
	site, err := s.createTestSite(nil)
	if err != nil {
		return nil
	}

	return &models.SceneEditDetailsInput{
		Title:   &title,
		Details: &details,
		Urls: []models.URL{
			{
				URL:    "http://example.org",
				SiteID: site.ID,
			},
		},
		Date:           &date,
		ProductionDate: &production_date,
		Performers: []models.PerformerAppearanceInput{
			{
				PerformerID: createdPerformer.UUID(),
				As:          &as,
			},
		},
		TagIds: []uuid.UUID{
			createdTag.UUID(),
		},
		Duration: &duration,
		Director: &director,
		Code:     &code,
	}
}

func (s *testRunner) createTestSceneEdit(operation models.OperationEnum, detailsInput *models.SceneEditDetailsInput, editInput *models.EditInput) (*models.Edit, error) {
	s.t.Helper()

	if editInput == nil {
		input := models.EditInput{
			Operation: operation,
		}
		editInput = &input
	}

	if detailsInput == nil {
		title := s.generateSceneName()
		input := models.SceneEditDetailsInput{
			Title: &title,
		}
		detailsInput = &input
	}

	sceneEditInput := models.SceneEditInput{
		Edit:    editInput,
		Details: detailsInput,
	}

	createdEdit, err := s.resolver.Mutation().SceneEdit(s.ctx, sceneEditInput)

	if err != nil {
		s.t.Errorf("Error creating edit: %s", err.Error())
		return nil, err
	}

	return createdEdit, nil
}

func (s *testRunner) getEditSceneDetails(input *models.Edit) *models.SceneEdit {
	s.t.Helper()
	r := s.resolver.Edit()

	details, _ := r.Details(s.ctx, input)
	sceneDetails := details.(*models.SceneEdit)
	return sceneDetails
}

func (s *testRunner) getEditSceneTarget(input *models.Edit) *models.Scene {
	s.t.Helper()
	r := s.resolver.Edit()

	target, _ := r.Target(s.ctx, input)
	sceneTarget := target.(*models.Scene)
	return sceneTarget
}

func (s *testRunner) generateSiteName() string {
	siteSuffix += 1
	return "site-" + strconv.Itoa(siteSuffix)
}

func (s *testRunner) createTestSite(input *models.SiteCreateInput) (*models.Site, error) {
	s.t.Helper()

	if input == nil {
		name := s.generateSiteName()
		desc := "Description for " + name
		input = &models.SiteCreateInput{
			Name:        name,
			Description: &desc,
			ValidTypes:  []models.ValidSiteTypeEnum{models.ValidSiteTypeEnumScene},
		}
	}

	createdSite, err := s.resolver.Mutation().SiteCreate(s.ctx, *input)

	if err != nil {
		s.t.Errorf("Error creating site: %s", err.Error())
		return nil, err
	}

	return createdSite, nil
}

func (s *testRunner) compareSiteURLs(input []models.URL, output []siteURL) {
	var convertedURLs []models.URL
	for _, url := range output {
		convertedURLs = append(convertedURLs, models.URL{
			URL:    url.URL,
			SiteID: uuid.FromStringOrNil(url.Site.ID),
		})
	}

	assert.Equal(s.t, input, convertedURLs)
}

func comparePerformers(input []models.PerformerAppearanceInput, performers []performerAppearance) bool {
	if len(performers) != len(input) {
		return false
	}

	for i, v := range performers {
		performerID := v.Performer.ID
		if performerID != input[i].PerformerID.String() {
			return false
		}

		if v.As != input[i].As {
			if v.As == nil || input[i].As == nil {
				return false
			}

			if *v.As != *input[i].As {
				return false
			}
		}
	}

	return true
}

func comparePerformersInput(input, performers []models.PerformerAppearanceInput) bool {
	if len(performers) != len(input) {
		return false
	}

	for i, v := range performers {
		performerID := v.PerformerID
		if performerID != input[i].PerformerID {
			return false
		}

		if v.As != input[i].As {
			if v.As == nil || input[i].As == nil {
				return false
			}

			if *v.As != *input[i].As {
				return false
			}
		}
	}

	return true
}

func compareTags(tagIDs []uuid.UUID, tags []idObject) bool {
	if len(tags) != len(tagIDs) {
		return false
	}

	for i, v := range tags {
		tagID := v.ID
		if tagID != tagIDs[i].String() {
			return false
		}
	}

	return true
}

func compareFingerprints(input []models.FingerprintEditInput, fingerprints []fingerprint) bool {
	if len(input) != len(fingerprints) {
		return false
	}

	for i, v := range fingerprints {
		if input[i].Algorithm != v.Algorithm || input[i].Hash != v.Hash {
			return false
		}
	}

	return true
}

func compareFingerprintsInput(input, fingerprints []models.FingerprintEditInput) bool {
	if len(input) != len(fingerprints) {
		return false
	}

	for i, v := range fingerprints {
		if input[i].Algorithm != v.Algorithm || input[i].Hash != v.Hash {
			return false
		}
	}

	return true
}

func assertBodyMods(t *testing.T, input []models.BodyModificationInput, bodyMods []models.BodyModification, text string) {
	t.Helper()

	// Flatten input to strings
	inputStrs := make([]string, len(input))
	for i, v := range input {
		desc := ""
		if v.Description != nil {
			desc = *v.Description
		}
		inputStrs[i] = v.Location + "|" + desc
	}

	// Flatten bodyMods to strings
	bodyModStrs := make([]string, len(bodyMods))
	for i, v := range bodyMods {
		desc := ""
		if v.Description != nil {
			desc = *v.Description
		}
		bodyModStrs[i] = v.Location + "|" + desc
	}

	// Use ElementsMatch for order-independent comparison
	assert.ElementsMatch(t, inputStrs, bodyModStrs, text)
}

func (s *testRunner) getUserNotificationSubscriptions() ([]models.NotificationEnum, error) {
	return s.client.getNotificationSubscriptions()
}
