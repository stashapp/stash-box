//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
)

type bulkFindTestRunner struct {
	testRunner
}

func createBulkFindTestRunner(t *testing.T) *bulkFindTestRunner {
	return &bulkFindTestRunner{
		testRunner: *asAdmin(t),
	}
}

func TestFindPerformers(t *testing.T) {
	s := createBulkFindTestRunner(t)

	first, err := s.createTestPerformer(nil)
	assert.NoError(t, err)
	second, err := s.createTestPerformer(nil)
	assert.NoError(t, err)

	missingID := uuid.Must(uuid.NewV4())
	// duplicate ids, an unknown id, and reversed creation order to verify that
	// the results are positional
	ids := []uuid.UUID{second.UUID(), missingID, first.UUID(), second.UUID()}

	performers, err := s.client.findPerformers(ids)
	assert.NoError(t, err)

	if !assert.Len(t, performers, len(ids)) {
		return
	}
	assert.Equal(t, second.ID, performers[0].ID)
	assert.Nil(t, performers[1])
	assert.Equal(t, first.ID, performers[2].ID)
	assert.Equal(t, second.ID, performers[3].ID)
	assert.Equal(t, second.Name, performers[0].Name)
}

func TestFindStudios(t *testing.T) {
	s := createBulkFindTestRunner(t)

	first, err := s.createTestStudio(nil)
	assert.NoError(t, err)
	second, err := s.createTestStudio(nil)
	assert.NoError(t, err)

	missingID := uuid.Must(uuid.NewV4())
	ids := []uuid.UUID{second.UUID(), missingID, first.UUID()}

	studios, err := s.client.findStudios(ids)
	assert.NoError(t, err)

	if !assert.Len(t, studios, len(ids)) {
		return
	}
	assert.Equal(t, second.ID, studios[0].ID)
	assert.Nil(t, studios[1])
	assert.Equal(t, first.ID, studios[2].ID)
	assert.Equal(t, second.Name, studios[0].Name)
}

func TestFindTags(t *testing.T) {
	s := createBulkFindTestRunner(t)

	first, err := s.createTestTag(nil)
	assert.NoError(t, err)
	second, err := s.createTestTag(nil)
	assert.NoError(t, err)

	missingID := uuid.Must(uuid.NewV4())
	ids := []uuid.UUID{second.UUID(), missingID, first.UUID()}

	tags, err := s.client.findTags(ids)
	assert.NoError(t, err)

	if !assert.Len(t, tags, len(ids)) {
		return
	}
	assert.Equal(t, second.ID, tags[0].ID)
	assert.Nil(t, tags[1])
	assert.Equal(t, first.ID, tags[2].ID)
	assert.Equal(t, second.Name, tags[0].Name)
}

func TestFindScenes(t *testing.T) {
	s := createBulkFindTestRunner(t)

	first, err := s.createTestScene(nil)
	assert.NoError(t, err)
	second, err := s.createTestScene(nil)
	assert.NoError(t, err)

	missingID := uuid.Must(uuid.NewV4())
	ids := []uuid.UUID{second.UUID(), missingID, first.UUID()}

	scenes, err := s.client.findScenes(ids)
	assert.NoError(t, err)

	if !assert.Len(t, scenes, len(ids)) {
		return
	}
	assert.Equal(t, second.ID, scenes[0].ID)
	assert.Nil(t, scenes[1])
	assert.Equal(t, first.ID, scenes[2].ID)
	assert.Equal(t, second.Title, scenes[0].Title)
}

func TestFindBulkEmptyIDs(t *testing.T) {
	s := createBulkFindTestRunner(t)

	performers, err := s.client.findPerformers([]uuid.UUID{})
	assert.NoError(t, err)
	assert.Empty(t, performers)

	scenes, err := s.client.findScenes([]uuid.UUID{})
	assert.NoError(t, err)
	assert.Empty(t, scenes)
}

func TestFindBulkTooManyIDs(t *testing.T) {
	s := createBulkFindTestRunner(t)

	ids := make([]uuid.UUID, 101)
	for i := range ids {
		ids[i] = uuid.Must(uuid.NewV4())
	}

	_, err := s.client.findPerformers(ids)
	assert.ErrorContains(t, err, "too many ids")

	_, err = s.client.findStudios(ids)
	assert.ErrorContains(t, err, "too many ids")

	_, err = s.client.findTags(ids)
	assert.ErrorContains(t, err, "too many ids")

	_, err = s.client.findScenes(ids)
	assert.ErrorContains(t, err, "too many ids")
}
