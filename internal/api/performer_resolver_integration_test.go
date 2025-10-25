//go:build integration
// +build integration

package api_test

import (
	"testing"
	"time"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type performerResolverTestRunner struct {
	testRunner
}

func createPerformerResolverTestRunner(t *testing.T) *performerResolverTestRunner {
	return &performerResolverTestRunner{
		testRunner: *asAdmin(t),
	}
}

// testPerformerImages tests the images resolver field
func (s *performerResolverTestRunner) testPerformerImages() {
	// Create a performer using the resolver
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name,
	})
	assert.NoError(s.t, err)

	// Get images via resolver
	images, err := s.resolver.Performer().Images(s.ctx, performer)
	assert.NoError(s.t, err)
	assert.Nil(s.t, images, "New performer should have nil images")
}

// testPerformerDeleted tests the deleted field
func (s *performerResolverTestRunner) testPerformerDeleted() {
	// Create a performer
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name,
	})
	assert.NoError(s.t, err)

	// Verify not deleted
	assert.Equal(s.t, false, performer.Deleted, "New performer should not be deleted")

	// Destroy the performer
	performerID := performer.ID
	destroyed, err := s.resolver.Mutation().PerformerDestroy(s.ctx, models.PerformerDestroyInput{
		ID: performerID,
	})
	assert.NoError(s.t, err)
	assert.True(s.t, destroyed, "Performer should be destroyed")

	// Find the performer again (it should still exist but marked as deleted)
	deletedPerformer, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(s.t, err)

	// The performer should be nil (destroyed performers are not returned)
	assert.Nil(s.t, deletedPerformer, "Deleted performer should not be returned")
}

// testPerformerEdits tests the edits resolver field
func (s *performerResolverTestRunner) testPerformerEdits() {
	// Create a performer via edit
	name := s.generatePerformerName()
	edit, err := s.createTestPerformerEdit(models.OperationEnumCreate, &models.PerformerEditDetailsInput{
		Name: &name,
	}, nil, nil)
	assert.NoError(s.t, err)

	// Apply the edit
	appliedEdit, err := s.applyEdit(edit.ID)
	assert.NoError(s.t, err)

	// Get the created performer ID from the edit
	target, err := s.resolver.Edit().Target(s.ctx, appliedEdit)
	assert.NoError(s.t, err)
	performer := target.(*models.Performer)

	// Get edits via resolver
	edits, err := s.resolver.Performer().Edits(s.ctx, performer)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, edits, "Edits should not be nil")
	assert.True(s.t, len(edits) >= 1, "Performer should have at least one edit")

	// Verify the edit we created is in the list
	foundEdit := false
	for _, e := range edits {
		if e.ID == edit.ID {
			foundEdit = true
			break
		}
	}
	assert.True(s.t, foundEdit, "Should find the create edit in performer's edits")
}

// testPerformerSceneCount tests the scene_count resolver field
func (s *performerResolverTestRunner) testPerformerSceneCount() {
	// Create a performer
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name,
	})
	assert.NoError(s.t, err)

	// Initially should have 0 scenes
	sceneCount, err := s.resolver.Performer().SceneCount(s.ctx, performer)
	assert.NoError(s.t, err)
	assert.Equal(s.t, 0, sceneCount, "New performer should have 0 scenes")

	// Create a scene with this performer
	performerID := performer.ID
	scene, err := s.resolver.Mutation().SceneCreate(s.ctx, models.SceneCreateInput{
		Date: "2020-01-01",
		Performers: []models.PerformerAppearanceInput{
			{
				PerformerID: performerID,
			},
		},
	})
	assert.NoError(s.t, err)
	assert.NotNil(s.t, scene)

	// Refresh the performer
	performer, err = s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(s.t, err)

	// Now should have 1 scene
	sceneCount, err = s.resolver.Performer().SceneCount(s.ctx, performer)
	assert.NoError(s.t, err)
	assert.Equal(s.t, 1, sceneCount, "Performer should have 1 scene")
}

// testPerformerScenes tests the scenes resolver field
func (s *performerResolverTestRunner) testPerformerScenes() {
	// Create a performer
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name,
	})
	assert.NoError(s.t, err)

	performerID := performer.ID

	// Create two scenes with this performer
	scene1, err := s.resolver.Mutation().SceneCreate(s.ctx, models.SceneCreateInput{
		Date: "2020-01-01",
		Performers: []models.PerformerAppearanceInput{
			{PerformerID: performerID},
		},
	})
	assert.NoError(s.t, err)

	scene2, err := s.resolver.Mutation().SceneCreate(s.ctx, models.SceneCreateInput{
		Date: "2020-02-02",
		Performers: []models.PerformerAppearanceInput{
			{PerformerID: performerID},
		},
	})
	assert.NoError(s.t, err)

	// Refresh the performer
	performer, err = s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(s.t, err)

	// Get scenes via resolver
	scenes, err := s.resolver.Performer().Scenes(s.ctx, performer, nil)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, scenes, "Scenes should not be nil")
	assert.True(s.t, len(scenes) >= 2, "Performer should have at least 2 scenes")

	// Verify our scenes are in the list
	foundScene1 := false
	foundScene2 := false
	for _, scene := range scenes {
		if scene.ID == scene1.ID {
			foundScene1 = true
		}
		if scene.ID == scene2.ID {
			foundScene2 = true
		}
	}
	assert.True(s.t, foundScene1, "Should find scene1 in performer's scenes")
	assert.True(s.t, foundScene2, "Should find scene2 in performer's scenes")
}

// testPerformerStudios tests the studios resolver field
func (s *performerResolverTestRunner) testPerformerStudios() {
	// Create a performer
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name,
	})
	assert.NoError(s.t, err)

	performerID := performer.ID

	// Create two different studios
	studio1Name := s.generateStudioName()
	studio1, err := s.resolver.Mutation().StudioCreate(s.ctx, models.StudioCreateInput{
		Name: studio1Name,
	})
	assert.NoError(s.t, err)

	studio2Name := s.generateStudioName()
	studio2, err := s.resolver.Mutation().StudioCreate(s.ctx, models.StudioCreateInput{
		Name: studio2Name,
	})
	assert.NoError(s.t, err)

	// Create scenes with this performer at different studios
	// Scene at studio1
	_, err = s.resolver.Mutation().SceneCreate(s.ctx, models.SceneCreateInput{
		Date:     "2020-01-01",
		StudioID: &studio1.ID,
		Performers: []models.PerformerAppearanceInput{
			{PerformerID: performerID},
		},
	})
	assert.NoError(s.t, err)

	// Scene at studio2
	_, err = s.resolver.Mutation().SceneCreate(s.ctx, models.SceneCreateInput{
		Date:     "2020-02-02",
		StudioID: &studio2.ID,
		Performers: []models.PerformerAppearanceInput{
			{PerformerID: performerID},
		},
	})
	assert.NoError(s.t, err)

	// Refresh the performer
	performer, err = s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(s.t, err)

	// Get studios via resolver
	studios, err := s.resolver.Performer().Studios(s.ctx, performer)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, studios, "Studios should not be nil")
	assert.True(s.t, len(studios) >= 2, "Performer should have appeared with at least 2 studios")

	// Verify our studios are in the list
	foundStudio1 := false
	foundStudio2 := false
	for _, ps := range studios {
		if ps.Studio.ID == studio1.ID {
			foundStudio1 = true
			assert.True(s.t, ps.SceneCount >= 1, "Studio1 should have at least 1 scene with this performer")
		}
		if ps.Studio.ID == studio2.ID {
			foundStudio2 = true
			assert.True(s.t, ps.SceneCount >= 1, "Studio2 should have at least 1 scene with this performer")
		}
	}
	assert.True(s.t, foundStudio1, "Should find studio1 in performer's studios")
	assert.True(s.t, foundStudio2, "Should find studio2 in performer's studios")
}

// testPerformerCreatedUpdated tests the created and updated timestamp fields
func (s *performerResolverTestRunner) testPerformerCreatedUpdated() {
	// Create a performer
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name,
	})
	assert.NoError(s.t, err)

	// Get created and updated timestamps - these are direct fields
	createdTime := performer.Created
	updatedTime := performer.Updated

	// Initially, updated should equal created
	assert.Equal(s.t, createdTime, updatedTime, "Updated should equal created for new performer")

	// Wait a bit to ensure timestamps are different
	time.Sleep(10 * time.Millisecond)

	// Update the performer
	performerID := performer.ID
	newAliases := []string{"Updated Alias"}
	ctx := s.updateContext([]string{"aliases"})
	updatedPerformer, err := s.resolver.Mutation().PerformerUpdate(ctx, models.PerformerUpdateInput{
		ID:      performerID,
		Aliases: newAliases,
	})
	assert.NoError(s.t, err)

	// Get new timestamps
	newCreatedTime := updatedPerformer.Created
	newUpdatedTime := updatedPerformer.Updated

	// Verify updated timestamp changed
	assert.True(s.t, newUpdatedTime.After(updatedTime), "Updated timestamp should be after original")
	// Created should remain the same
	assert.Equal(s.t, newCreatedTime, createdTime, "Created timestamp should not change on update")
}

// testPerformerAge tests the age calculated field
func (s *performerResolverTestRunner) testPerformerAge() {
	// Create a performer with a known birthdate
	birthdate := "2000-01-01"
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name:      name,
		Birthdate: &birthdate,
	})
	assert.NoError(s.t, err)

	// Get age via resolver
	age, err := s.resolver.Performer().Age(s.ctx, performer)
	assert.NoError(s.t, err)

	// Age should be approximately current year - 2000
	currentYear := time.Now().Year()
	expectedAge := currentYear - 2000
	assert.NotNil(s.t, age, "Age should not be nil for performer with birthdate")
	assert.True(s.t, *age >= expectedAge-1 && *age <= expectedAge+1, "Age should be approximately %d, got %d", expectedAge, *age)

	// Create a performer without birthdate
	name2 := s.generatePerformerName()
	performerNoBirthdate, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name2,
	})
	assert.NoError(s.t, err)

	// Age should be nil
	ageNil, err := s.resolver.Performer().Age(s.ctx, performerNoBirthdate)
	assert.NoError(s.t, err)
	assert.Nil(s.t, ageNil, "Age should be nil for performer without birthdate")

	// Create a performer with a deathdate
	deathdate := "2020-06-15"
	name3 := s.generatePerformerName()
	performerDeceased, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name:      name3,
		Birthdate: &birthdate,
		Deathdate: &deathdate,
	})
	assert.NoError(s.t, err)

	// Age should be calculated from birthdate to deathdate
	ageDeceased, err := s.resolver.Performer().Age(s.ctx, performerDeceased)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, ageDeceased, "Age should not be nil for deceased performer with both dates")
	// Age at death should be 20 (2020 - 2000)
	assert.Equal(s.t, *ageDeceased, 20, "Age at death should be 20")
}

// testPerformerAliases tests the aliases resolver field
func (s *performerResolverTestRunner) testPerformerAliases() {
	// Create a performer with aliases
	aliases := []string{"Alias One", "Alias Two", "Alias Three"}
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name:    name,
		Aliases: aliases,
	})
	assert.NoError(s.t, err)

	// Get aliases via resolver
	retrievedAliases, err := s.resolver.Performer().Aliases(s.ctx, performer)
	assert.NoError(s.t, err)
	assert.ElementsMatch(s.t, retrievedAliases, aliases)

	// Create performer without aliases
	name2 := s.generatePerformerName()
	performerNoAliases, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name2,
	})
	assert.NoError(s.t, err)

	// Should have no aliases
	emptyAliases, err := s.resolver.Performer().Aliases(s.ctx, performerNoAliases)
	assert.NoError(s.t, err)
	assert.Equal(s.t, len(emptyAliases), 0, "Performer without aliases should have no aliases")
}

// testPerformerUrls tests the urls resolver field
func (s *performerResolverTestRunner) testPerformerUrls() {
	// Create a site for URLs
	siteName := s.generateSiteName()
	site, err := s.resolver.Mutation().SiteCreate(s.ctx, models.SiteCreateInput{
		Name: siteName,
	})
	assert.NoError(s.t, err)

	// Create a performer with URLs
	urls := []models.URL{
		{URL: "http://example.com/performer1", SiteID: site.ID},
		{URL: "http://example.com/performer2", SiteID: site.ID},
	}
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name,
		Urls: urls,
	})
	assert.NoError(s.t, err)

	// Get URLs via resolver
	retrievedUrls, err := s.resolver.Performer().Urls(s.ctx, performer)
	assert.NoError(s.t, err)
	assert.Equal(s.t, len(retrievedUrls), len(urls), "Should have same number of URLs")

	// Verify URLs match
	for i, url := range retrievedUrls {
		assert.Equal(s.t, url.URL, urls[i].URL, "URL should match")
		assert.Equal(s.t, url.SiteID, urls[i].SiteID, "Site ID should match")
	}
}

// testPerformerBirthdate tests the birthdate resolver field
func (s *performerResolverTestRunner) testPerformerBirthdate() {
	// Create a performer with a birthdate
	birthdate := "2000-05-15"
	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name:      name,
		Birthdate: &birthdate,
	})
	assert.NoError(s.t, err)

	// Get birthdate via resolver
	retrievedBirthdate, err := s.resolver.Performer().Birthdate(s.ctx, performer)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, retrievedBirthdate, "Birthdate should not be nil")
	assert.Equal(s.t, retrievedBirthdate.Date, birthdate, "Birthdate should match")

	// Create performer without birthdate
	name2 := s.generatePerformerName()
	performerNoBirthdate, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name: name2,
	})
	assert.NoError(s.t, err)

	// Should be nil
	nilBirthdate, err := s.resolver.Performer().Birthdate(s.ctx, performerNoBirthdate)
	assert.NoError(s.t, err)
	assert.Nil(s.t, nilBirthdate, "Birthdate should be nil for performer without birthdate")
}

// testPerformerTattoosAndPiercings tests the tattoos and piercings resolver fields
func (s *performerResolverTestRunner) testPerformerTattoosAndPiercings() {
	tattooDesc := "Dragon on back"
	piercingDesc := "Silver ring"

	// Create a performer with tattoos and piercings
	tattoos := []models.BodyModificationInput{
		{Location: "Back", Description: &tattooDesc},
		{Location: "Arm", Description: nil},
	}
	piercings := []models.BodyModificationInput{
		{Location: "Nose", Description: &piercingDesc},
		{Location: "Navel", Description: nil},
	}

	name := s.generatePerformerName()
	performer, err := s.resolver.Mutation().PerformerCreate(s.ctx, models.PerformerCreateInput{
		Name:      name,
		Tattoos:   tattoos,
		Piercings: piercings,
	})
	assert.NoError(s.t, err)

	// Get tattoos via resolver
	retrievedTattoos, err := s.resolver.Performer().Tattoos(s.ctx, performer)
	assert.NoError(s.t, err)
	assertBodyMods(s.t, tattoos, retrievedTattoos, "Tattoos should match")

	// Get piercings via resolver
	retrievedPiercings, err := s.resolver.Performer().Piercings(s.ctx, performer)
	assert.NoError(s.t, err)
	assert.Equal(s.t, len(retrievedPiercings), len(piercings), "Should have same number of piercings")
	assertBodyMods(s.t, piercings, retrievedPiercings, "Piercings should match")
}

func TestPerformerImages(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerImages()
}

func TestPerformerDeleted(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerDeleted()
}

func TestPerformerEdits(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerEdits()
}

func TestPerformerSceneCount(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerSceneCount()
}

func TestPerformerScenes(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerScenes()
}

func TestPerformerStudios(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerStudios()
}

func TestPerformerCreatedUpdated(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerCreatedUpdated()
}

func TestPerformerAge(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerAge()
}

func TestPerformerAliases(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerAliases()
}

func TestPerformerUrls(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerUrls()
}

func TestPerformerBirthdate(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerBirthdate()
}

func TestPerformerTattoosAndPiercings(t *testing.T) {
	pt := createPerformerResolverTestRunner(t)
	pt.testPerformerTattoosAndPiercings()
}
