//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

// changelogEpoch is a since value far enough in the past to return everything.
const changelogEpoch = "1970-01-01T00:00:00Z"

type changelogTestRunner struct {
	testRunner
}

func createChangelogTestRunner(t *testing.T) *changelogTestRunner {
	return &changelogTestRunner{
		testRunner: *asAdmin(t),
	}
}

func findChange(changes []entityChange, id string) *entityChange {
	for i := range changes {
		if changes[i].ID == id {
			return &changes[i]
		}
	}
	return nil
}

// sceneCursor creates a sentinel scene and returns a keyset cursor positioned at
// it. Scenes created afterwards get strictly greater updated_at (separate
// transactions -> distinct now()), so the cursor cleanly excludes the sentinel
// and isolates the test from data created by earlier tests sharing the DB.
func (s *changelogTestRunner) sceneCursor() (since string, afterID uuid.UUID) {
	sentinelScene, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

	base, err := s.client.changelog("sceneChangelog", changelogEpoch, nil, nil)
	assert.NoError(s.t, err)

	sentinel := findChange(base, sentinelScene.ID)
	assert.NotNil(s.t, sentinel, "sentinel scene should appear in changelog")
	if sentinel == nil {
		return changelogEpoch, uuid.Nil
	}
	return sentinel.UpdatedAt, uuid.FromStringOrNil(sentinel.ID)
}

func (s *changelogTestRunner) testSceneChangelogCursor() {
	since, afterID := s.sceneCursor()

	s1, err := s.createTestScene(nil)
	assert.NoError(s.t, err)
	s2, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

	changes, err := s.client.changelog("sceneChangelog", since, &afterID, nil)
	assert.NoError(s.t, err)

	assert.Nil(s.t, findChange(changes, afterID.String()), "scene at the cursor should be excluded")

	c1 := findChange(changes, s1.ID)
	c2 := findChange(changes, s2.ID)
	assert.NotNil(s.t, c1, "scene created after the cursor should appear")
	assert.NotNil(s.t, c2, "scene created after the cursor should appear")
	if c1 != nil {
		assert.False(s.t, c1.Deleted)
		assert.Nil(s.t, c1.RedirectTo)
	}
}

// testSceneChangelogPagination walks the feed one row at a time and asserts that
// every created scene is returned exactly once. Completeness + no duplicates is
// a full end-to-end check of the (updated_at, id) keyset: a skip breaks
// completeness, a repeat breaks uniqueness.
func (s *changelogTestRunner) testSceneChangelogPagination() {
	since, afterID := s.sceneCursor()

	created := map[string]bool{}
	for i := 0; i < 3; i++ {
		sc, err := s.createTestScene(nil)
		assert.NoError(s.t, err)
		created[sc.ID] = true
	}

	limit := 1
	seen := map[string]bool{}
	for iter := 0; iter < 100; iter++ {
		page, err := s.client.changelog("sceneChangelog", since, &afterID, &limit)
		assert.NoError(s.t, err)
		if len(page) == 0 {
			break
		}
		assert.Len(s.t, page, 1, "limit should cap the page size")
		row := page[0]
		assert.False(s.t, seen[row.ID], "row returned twice during pagination")
		seen[row.ID] = true
		since = row.UpdatedAt
		afterID = uuid.FromStringOrNil(row.ID)
	}

	for id := range created {
		assert.True(s.t, seen[id], "created scene missing from paginated changelog")
	}
}

func (s *changelogTestRunner) testSceneChangelogDeleted() {
	since, afterID := s.sceneCursor()

	scene, err := s.createTestScene(nil)
	assert.NoError(s.t, err)
	sceneID := scene.UUID()

	editInput := models.EditInput{Operation: models.OperationEnumDestroy, ID: &sceneID}
	edit, err := s.createTestSceneEdit(models.OperationEnumDestroy, &models.SceneEditDetailsInput{}, &editInput)
	assert.NoError(s.t, err)
	_, err = s.approveEdit(edit.ID)
	assert.NoError(s.t, err)

	changes, err := s.client.changelog("sceneChangelog", since, &afterID, nil)
	assert.NoError(s.t, err)

	ch := findChange(changes, scene.ID)
	assert.NotNil(s.t, ch, "deleted scene should appear in changelog")
	if ch != nil {
		assert.True(s.t, ch.Deleted, "scene should be marked deleted")
		assert.Nil(s.t, ch.RedirectTo, "a plain delete should have no redirect")
	}
}

func (s *changelogTestRunner) testSceneChangelogMerge() {
	since, afterID := s.sceneCursor()

	primary, err := s.createTestScene(nil)
	assert.NoError(s.t, err)
	source, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

	primaryID := primary.UUID()
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &primaryID,
		MergeSourceIds: []uuid.UUID{source.UUID()},
	}
	edit, err := s.createTestSceneEdit(models.OperationEnumMerge, nil, &editInput)
	assert.NoError(s.t, err)
	_, err = s.approveEdit(edit.ID)
	assert.NoError(s.t, err)

	changes, err := s.client.changelog("sceneChangelog", since, &afterID, nil)
	assert.NoError(s.t, err)

	ch := findChange(changes, source.ID)
	assert.NotNil(s.t, ch, "merged-away scene should appear in changelog")
	if ch != nil {
		assert.True(s.t, ch.Deleted, "merged scene should be marked deleted")
		assert.NotNil(s.t, ch.RedirectTo, "merged scene should carry a redirect")
		if ch.RedirectTo != nil {
			assert.Equal(s.t, primary.ID, *ch.RedirectTo, "redirect should point to the surviving scene")
		}
	}
}

// testEntityChangelogs exercises the performer/studio/tag feeds, which share the
// resolver/query/index pattern with scenes.
func (s *changelogTestRunner) testEntityChangelogs() {
	performer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)
	studio, err := s.createTestStudio(nil)
	assert.NoError(s.t, err)
	tag, err := s.createTestTag(nil)
	assert.NoError(s.t, err)

	performers, err := s.client.changelog("performerChangelog", changelogEpoch, nil, nil)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, findChange(performers, performer.ID), "performer should appear in performerChangelog")

	studios, err := s.client.changelog("studioChangelog", changelogEpoch, nil, nil)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, findChange(studios, studio.ID), "studio should appear in studioChangelog")

	tags, err := s.client.changelog("tagChangelog", changelogEpoch, nil, nil)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, findChange(tags, tag.ID), "tag should appear in tagChangelog")
}

func (s *changelogTestRunner) testChangelogRequiresRead() {
	none := asNone(s.t)
	_, err := none.client.changelog("sceneChangelog", changelogEpoch, nil, nil)
	assert.Error(s.t, err, "changelog should require the READ role")
}

func TestSceneChangelogCursor(t *testing.T) {
	createChangelogTestRunner(t).testSceneChangelogCursor()
}

func TestSceneChangelogPagination(t *testing.T) {
	createChangelogTestRunner(t).testSceneChangelogPagination()
}

func TestSceneChangelogDeleted(t *testing.T) {
	createChangelogTestRunner(t).testSceneChangelogDeleted()
}

func TestSceneChangelogMerge(t *testing.T) {
	createChangelogTestRunner(t).testSceneChangelogMerge()
}

func TestEntityChangelogs(t *testing.T) {
	createChangelogTestRunner(t).testEntityChangelogs()
}

func TestChangelogRequiresRead(t *testing.T) {
	createChangelogTestRunner(t).testChangelogRequiresRead()
}
