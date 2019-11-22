// +build integration

package api_test

import (
	"context"
	"errors"
	"strconv"
	"testing"

	"github.com/stashapp/stashdb/pkg/api"
	dbtest "github.com/stashapp/stashdb/pkg/database/databasetest"
	"github.com/stashapp/stashdb/pkg/models"

	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
)

func TestMain(m *testing.M) {
	dbtest.TestWithDatabase(m, nil)
}

type integrationTestSuite struct {
	t        *testing.T
	resolver api.Resolver
	ctx      context.Context
}

func (s *integrationTestSuite) testCreatePerformer() (*models.Performer, error) {
	disambiguation := "Disambiguation"
	country := "USA"
	height := 182
	cupSize := "C"
	bandSize := 32
	careerStartYear := 2000
	tattooDesc := "Foobar"
	gender := models.GenderEnumFemale
	ethnicity := models.EthnicityEnumCaucasian
	eyeColor := models.EyeColorEnumBlue
	hairColor := models.HairColorEnumBlonde
	breastType := models.BreastTypeEnumNatural

	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name:           "Name",
		Disambiguation: &disambiguation,
		Aliases:        []string{"Alias1", "Alias2"},
		Gender:         &gender,
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "URL",
				Type: "Type",
			},
		},
		Birthdate: &models.FuzzyDateInput{
			Date:     "2001-02-03",
			Accuracy: models.DateAccuracyEnumDay,
		},
		Ethnicity: &ethnicity,
		Country:   &country,
		EyeColor:  &eyeColor,
		HairColor: &hairColor,
		Height:    &height,
		Measurements: &models.MeasurementsInput{
			CupSize:  &cupSize,
			BandSize: &bandSize,
			Waist:    &bandSize,
			Hip:      &bandSize,
		},
		BreastType:      &breastType,
		CareerStartYear: &careerStartYear,
		CareerEndYear:   nil,
		Tattoos: []*models.BodyModificationInput{
			&models.BodyModificationInput{
				Location:    "Inner thigh",
				Description: &tattooDesc,
			},
		},
		Piercings: []*models.BodyModificationInput{
			&models.BodyModificationInput{
				Location:    "Nose",
				Description: nil,
			},
		},
	})

	if err != nil {
		s.t.Errorf("Error creating performer: %s", err.Error())
		return nil, err
	}

	return performer, nil
}

func (s *integrationTestSuite) testFindPerformer(id int64) (*models.Performer, error) {
	// get Performer
	performer, err := s.resolver.Query().FindPerformer(s.ctx, strconv.FormatInt(id, 10))
	if err != nil {
		s.t.Errorf("Error finding performer: %s", err.Error())
		return nil, err
	}

	// ensure returned performer is not nil
	if performer == nil {
		err := errors.New("Did not find performer by id")
		s.t.Error(err.Error())
		return nil, err
	}

	return performer, nil
}

func (s *integrationTestSuite) testUpdatePerformer(id int64) error {
	newName := "NewName"
	_, err := s.resolver.Mutation().PerformerUpdate(s.ctx, models.PerformerUpdateInput{
		ID:   strconv.FormatInt(id, 10),
		Name: &newName,
	})
	if err != nil {
		s.t.Errorf("Error updating performer: %s", err.Error())
		return err
	}

	// verify that update succeeded
	updatedPerformer, err := s.testFindPerformer(id)
	if err != nil {
		return err
	}

	if updatedPerformer.Name != newName {
		s.t.Errorf("Expected name to be updated to '%s', got '%s'", newName, updatedPerformer.Name)
	}

	// TODO - ensure other fields were not updated
	return nil
}

func (s *integrationTestSuite) testCreateStudio() (*models.Studio, error) {
	studio, err := s.resolver.Mutation().StudioCreate(s.ctx, models.StudioCreateInput{
		Name: "Name",
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "url",
				Type: "type",
			},
		},
	})

	if err != nil {
		s.t.Errorf("Error creating studio: %s", err.Error())
		return nil, err
	}

	return studio, nil
}

func (s *integrationTestSuite) testFindStudioById(id int64) (*models.Studio, error) {
	// get Studio
	idStr := strconv.FormatInt(id, 10)
	studio, err := s.resolver.Query().FindStudio(s.ctx, &idStr, nil)
	if err != nil {
		s.t.Errorf("Error finding studio by id: %s", err.Error())
		return nil, err
	}

	// ensure returned studio is not nil
	if studio == nil {
		err := errors.New("Did not find studio by id")
		s.t.Error(err.Error())
		return nil, err
	}

	return studio, nil
}

func (s *integrationTestSuite) testFindStudioByName(name string) (*models.Studio, error) {
	// get Studio
	studio, err := s.resolver.Query().FindStudio(s.ctx, nil, &name)
	if err != nil {
		s.t.Errorf("Error finding studio by name: %s", err.Error())
		return nil, err
	}

	// ensure returned studio is not nil
	if studio == nil {
		err := errors.New("Did not find studio by name")
		s.t.Error(err.Error())
		return nil, err
	}

	return studio, nil
}

func (s *integrationTestSuite) testUpdateStudio(id int64) error {
	newName := "NewName"
	_, err := s.resolver.Mutation().StudioUpdate(s.ctx, models.StudioUpdateInput{
		ID:   strconv.FormatInt(id, 10),
		Name: &newName,
	})
	if err != nil {
		s.t.Errorf("Error updating studio: %s", err.Error())
		return err
	}

	// verify that update succeeded
	updatedStudio, err := s.testFindStudioById(id)
	if err != nil {
		return err
	}

	if updatedStudio.Name != newName {
		s.t.Errorf("Expected name to be updated to '%s', got '%s'", newName, updatedStudio.Name)
	}

	// TODO - ensure other fields were not updated
	return nil
}

func (s *integrationTestSuite) testCreateTag() (*models.Tag, error) {
	description := "Description"
	tag, err := s.resolver.Mutation().TagCreate(s.ctx, models.TagCreateInput{
		Name:        "Name",
		Description: &description,
		Aliases: []string{
			"Alias",
		},
	})

	if err != nil {
		s.t.Errorf("Error creating tag: %s", err.Error())
		return nil, err
	}

	return tag, nil
}

func (s *integrationTestSuite) testFindTagById(id int64) (*models.Tag, error) {
	// get Tag
	idStr := strconv.FormatInt(id, 10)
	tag, err := s.resolver.Query().FindTag(s.ctx, &idStr, nil)
	if err != nil {
		s.t.Errorf("Error finding tag by id: %s", err.Error())
		return nil, err
	}

	// ensure returned tag is not nil
	if tag == nil {
		err := errors.New("Did not find tag by id")
		s.t.Error(err.Error())
		return nil, err
	}

	return tag, nil
}

func (s *integrationTestSuite) testFindTagByName(name string) (*models.Tag, error) {
	// get Tag
	tag, err := s.resolver.Query().FindTag(s.ctx, nil, &name)
	if err != nil {
		s.t.Errorf("Error finding tag by name: %s", err.Error())
		return nil, err
	}

	// ensure returned tag is not nil
	if tag == nil {
		err := errors.New("Did not find tag by name")
		s.t.Error(err.Error())
		return nil, err
	}

	return tag, nil
}

func (s *integrationTestSuite) testUpdateTag(id int64) error {
	newName := "NewName"
	_, err := s.resolver.Mutation().TagUpdate(s.ctx, models.TagUpdateInput{
		ID:   strconv.FormatInt(id, 10),
		Name: &newName,
	})
	if err != nil {
		s.t.Errorf("Error updating tag: %s", err.Error())
		return err
	}

	// verify that update succeeded
	updatedTag, err := s.testFindTagById(id)
	if err != nil {
		return err
	}

	if updatedTag.Name != newName {
		s.t.Errorf("Expected name to be updated to '%s', got '%s'", newName, updatedTag.Name)
	}

	// TODO - ensure other fields were not updated
	return nil
}

func (s *integrationTestSuite) testCreateScene(studioID, performerID, tagID int64) (*models.Scene, error) {
	title := "Title"
	details := "Details"
	url := "URL"
	date := "2003-02-01"
	performerAs := "As"
	studioIDStr := strconv.FormatInt(studioID, 10)
	performerIDStr := strconv.FormatInt(performerID, 10)
	tagIDStr := strconv.FormatInt(tagID, 10)
	scene, err := s.resolver.Mutation().SceneCreate(s.ctx, models.SceneCreateInput{
		Title:    &title,
		Details:  &details,
		URL:      &url,
		Date:     &date,
		StudioID: &studioIDStr,
		Performers: []*models.PerformerAppearanceInput{
			&models.PerformerAppearanceInput{
				PerformerID: performerIDStr,
				As:          &performerAs,
			},
		},
		TagIds: []string{
			tagIDStr,
		},
		Checksums: []string{
			"checksum",
		},
	})

	if err != nil {
		s.t.Errorf("Error creating scene: %s", err.Error())
		return nil, err
	}

	return scene, nil
}

func (s *integrationTestSuite) testFindSceneById(id int64) (*models.Scene, error) {
	// get Scene
	idStr := strconv.FormatInt(id, 10)
	scene, err := s.resolver.Query().FindScene(s.ctx, &idStr, nil)
	if err != nil {
		s.t.Errorf("Error finding scene by id: %s", err.Error())
		return nil, err
	}

	// ensure returned scene is not nil
	if scene == nil {
		err := errors.New("Did not find scene by id")
		s.t.Error(err.Error())
		return nil, err
	}

	return scene, nil
}

func (s *integrationTestSuite) testFindSceneByChecksum(checksum string) (*models.Scene, error) {
	// get Scene
	scene, err := s.resolver.Query().FindScene(s.ctx, nil, &checksum)
	if err != nil {
		s.t.Errorf("Error finding scene by checksum: %s", err.Error())
		return nil, err
	}

	// ensure returned scene is not nil
	if scene == nil {
		err := errors.New("Did not find scene by checksum")
		s.t.Error(err.Error())
		return nil, err
	}

	return scene, nil
}

func (s *integrationTestSuite) testUpdateScene(id int64) error {
	newTitle := "NewTitle"
	_, err := s.resolver.Mutation().SceneUpdate(s.ctx, models.SceneUpdateInput{
		ID:    strconv.FormatInt(id, 10),
		Title: &newTitle,
	})
	if err != nil {
		s.t.Errorf("Error updating scene: %s", err.Error())
		return err
	}

	// verify that update succeeded
	updatedScene, err := s.testFindSceneById(id)
	if err != nil {
		return err
	}

	if updatedScene.Title.String != newTitle {
		s.t.Errorf("Expected name to be updated to '%s', got '%s'", newTitle, updatedScene.Title.String)
	}

	// TODO - ensure other fields were not updated
	return nil
}

func (s *integrationTestSuite) testDestroyPerformer(performerID, sceneID int64) error {
	performerIDStr := strconv.FormatInt(performerID, 10)
	destroyed, err := s.resolver.Mutation().PerformerDestroy(s.ctx, models.PerformerDestroyInput{
		ID: performerIDStr,
	})

	if err != nil {
		s.t.Errorf("Error destroying performer: %s", err.Error())
		return err
	}

	if !destroyed {
		err = errors.New("Performer was not destroyed")
		s.t.Errorf(err.Error())
		return err
	}

	// ensure cannot find performer
	foundPerformer, err := s.resolver.Query().FindPerformer(s.ctx, performerIDStr)
	if err != nil {
		s.t.Errorf("Error finding performer after destroying: %s", err.Error())
		return err
	}

	if foundPerformer != nil {
		err = errors.New("Found performer after destruction")
		s.t.Errorf(err.Error())
		return err
	}

	// ensure scene still exists
	scene, err := s.testFindSceneById(sceneID)
	if err != nil {
		return err
	}

	if scene == nil {
		err = errors.New("Scene not found after performer destruction")
		s.t.Error(err.Error())
		return err
	}

	// TODO - ensure scene performers are blanked

	return nil
}

func (s *integrationTestSuite) testDestroyStudio(studioID, sceneID int64) error {
	studioIDStr := strconv.FormatInt(studioID, 10)
	destroyed, err := s.resolver.Mutation().StudioDestroy(s.ctx, models.StudioDestroyInput{
		ID: studioIDStr,
	})

	if err != nil {
		s.t.Errorf("Error destroying studio: %s", err.Error())
		return err
	}

	if !destroyed {
		err = errors.New("Studio was not destroyed")
		s.t.Errorf(err.Error())
		return err
	}

	// ensure cannot find studio
	foundStudio, err := s.resolver.Query().FindStudio(s.ctx, &studioIDStr, nil)
	if err != nil {
		s.t.Errorf("Error finding studio after destroying: %s", err.Error())
		return err
	}

	if foundStudio != nil {
		err = errors.New("Found studio after destruction")
		s.t.Errorf(err.Error())
		return err
	}

	// ensure scene still exists
	scene, err := s.testFindSceneById(sceneID)
	if err != nil {
		return err
	}

	if scene == nil {
		err = errors.New("Scene not found after studio destruction")
		s.t.Error(err.Error())
		return err
	}

	return nil
}

func (s *integrationTestSuite) testDestroyTag(tagID, sceneID int64) error {
	tagIDStr := strconv.FormatInt(tagID, 10)
	destroyed, err := s.resolver.Mutation().TagDestroy(s.ctx, models.TagDestroyInput{
		ID: tagIDStr,
	})

	if err != nil {
		s.t.Errorf("Error destroying tag: %s", err.Error())
		return err
	}

	if !destroyed {
		err = errors.New("Tag was not destroyed")
		s.t.Errorf(err.Error())
		return err
	}

	// ensure cannot find studio
	foundTag, err := s.resolver.Query().FindTag(s.ctx, &tagIDStr, nil)
	if err != nil {
		s.t.Errorf("Error finding tag after destroying: %s", err.Error())
		return err
	}

	if foundTag != nil {
		err = errors.New("Found tag after destruction")
		s.t.Errorf(err.Error())
		return err
	}

	// ensure scene still exists
	scene, err := s.testFindSceneById(sceneID)
	if err != nil {
		return err
	}

	if scene == nil {
		err = errors.New("Scene not found after tag destruction")
		s.t.Error(err.Error())
		return err
	}

	return nil
}

func (s *integrationTestSuite) testDestroyScene(sceneID int64) error {
	sceneIDStr := strconv.FormatInt(sceneID, 10)
	destroyed, err := s.resolver.Mutation().SceneDestroy(s.ctx, models.SceneDestroyInput{
		ID: sceneIDStr,
	})

	if err != nil {
		s.t.Errorf("Error destroying scene: %s", err.Error())
		return err
	}

	if !destroyed {
		err = errors.New("Scene was not destroyed")
		s.t.Errorf(err.Error())
		return err
	}

	// ensure cannot find scene
	foundScene, err := s.resolver.Query().FindScene(s.ctx, &sceneIDStr, nil)
	if err != nil {
		s.t.Errorf("Error finding scene after destroying: %s", err.Error())
		return err
	}

	if foundScene != nil {
		err = errors.New("Found scene after destruction")
		s.t.Errorf(err.Error())
		return err
	}

	return nil
}

func TestIntegration(t *testing.T) {
	resolver := api.Resolver{}

	// create Performer
	ctx := context.TODO()
	ctx = context.WithValue(ctx, api.ContextRole, api.ModifyRole)

	s := integrationTestSuite{
		t:        t,
		ctx:      ctx,
		resolver: resolver,
	}

	performer, err := s.testCreatePerformer()
	if err != nil {
		return
	}

	// get Performer
	_, err = s.testFindPerformer(performer.ID)
	if err != nil {
		return
	}

	// update Performer
	err = s.testUpdatePerformer(performer.ID)
	if err != nil {
		return
	}

	// TODO - query performer

	// create Studio
	studio, err := s.testCreateStudio()
	if err != nil {
		return
	}

	// get Studio
	_, err = s.testFindStudioById(studio.ID)
	if err != nil {
		return
	}

	_, err = s.testFindStudioByName(studio.Name)
	if err != nil {
		return
	}

	// update Studio
	err = s.testUpdateStudio(studio.ID)
	if err != nil {
		return
	}

	// create Tag
	tag, err := s.testCreateTag()
	if err != nil {
		return
	}

	// get Tag
	_, err = s.testFindTagById(tag.ID)
	if err != nil {
		return
	}

	_, err = s.testFindTagByName(tag.Name)
	if err != nil {
		return
	}

	// update Tag
	err = s.testUpdateTag(tag.ID)
	if err != nil {
		return
	}

	// create Scene
	scene, err := s.testCreateScene(studio.ID, performer.ID, tag.ID)
	if err != nil {
		return
	}

	// get Tag
	_, err = s.testFindSceneById(scene.ID)
	if err != nil {
		return
	}

	_, err = s.testFindSceneByChecksum("checksum")
	if err != nil {
		return
	}

	// update Scene
	err = s.testUpdateScene(scene.ID)
	if err != nil {
		return
	}

	// delete Performer
	err = s.testDestroyPerformer(performer.ID, scene.ID)
	if err != nil {
		return
	}

	// delete Studio
	err = s.testDestroyStudio(studio.ID, scene.ID)
	if err != nil {
		return
	}

	// delete Tag
	err = s.testDestroyTag(tag.ID, scene.ID)
	if err != nil {
		return
	}

	// delete Scene
	err = s.testDestroyScene(scene.ID)
}
