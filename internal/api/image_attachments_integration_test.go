//go:build integration

package api_test

import (
	"testing"

	"github.com/99designs/gqlgen/client"
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type imageAttachments struct {
	ID         string
	Performers []idObject
	Scenes     []idObject
	Studios    []idObject
}

func TestImageAttachmentsResolveAllEntities(t *testing.T) {
	s := asAdmin(t)
	shared, err := s.createTestImage(400, 600)
	require.NoError(t, err)
	empty, err := s.createTestImage(400, 600)
	require.NoError(t, err)
	other, err := s.createTestImage(400, 600)
	require.NoError(t, err)

	var expected imageAttachments
	for range 2 {
		performer, err := s.createTestPerformer(&models.PerformerCreateInput{
			Name: s.generatePerformerName(), ImageIds: []uuid.UUID{shared.ID},
		})
		require.NoError(t, err)
		expected.Performers = append(expected.Performers, idObject{ID: performer.ID})

		title := s.generateSceneName()
		scene, err := s.createTestScene(&models.SceneCreateInput{
			Title: &title, ImageIds: []uuid.UUID{shared.ID},
		})
		require.NoError(t, err)
		expected.Scenes = append(expected.Scenes, idObject{ID: scene.ID})

		studio, err := s.createTestStudio(&models.StudioCreateInput{
			Name: s.generateStudioName(), ImageIds: []uuid.UUID{shared.ID},
		})
		require.NoError(t, err)
		expected.Studios = append(expected.Studios, idObject{ID: studio.ID})
	}
	otherStudio, err := s.createTestStudio(&models.StudioCreateInput{
		Name: s.generateStudioName(), ImageIds: []uuid.UUID{other.ID},
	})
	require.NoError(t, err)

	var response struct {
		Shared imageAttachments
		Empty  imageAttachments
		Other  imageAttachments
	}
	reader := asRead(t)
	err = reader.client.Post(`
		query($shared: ID!, $empty: ID!, $other: ID!) {
			shared: findImage(id: $shared) { ...Attachments }
			empty: findImage(id: $empty) { ...Attachments }
			other: findImage(id: $other) { ...Attachments }
		}
		fragment Attachments on Image {
			id
			performers { id }
			scenes { id }
			studios { id }
		}`,
		&response,
		client.Var("shared", shared.ID), client.Var("empty", empty.ID), client.Var("other", other.ID),
	)
	require.NoError(t, err)
	assert.ElementsMatch(t, expected.Performers, response.Shared.Performers)
	assert.ElementsMatch(t, expected.Scenes, response.Shared.Scenes)
	assert.ElementsMatch(t, expected.Studios, response.Shared.Studios)
	assert.Equal(t, imageAttachments{ID: empty.ID.String(), Performers: []idObject{}, Scenes: []idObject{}, Studios: []idObject{}}, response.Empty)
	assert.Equal(t, imageAttachments{
		ID: other.ID.String(), Performers: []idObject{}, Scenes: []idObject{}, Studios: []idObject{{ID: otherStudio.ID}},
	}, response.Other)
}

func TestQueryUnorganizedImagesOnlyIncludesPerformerAttachmentsOnce(t *testing.T) {
	s := createOrganizedTestRunner(t)
	countBefore := s.feedCount()

	sceneOnly, err := s.createTestImage(400, 600)
	require.NoError(t, err)
	studioOnly, err := s.createTestImage(400, 600)
	require.NoError(t, err)
	shared, err := s.createTestImage(400, 600)
	require.NoError(t, err)
	unattached, err := s.createTestImage(400, 600)
	require.NoError(t, err)

	title := s.generateSceneName()
	_, err = s.createTestScene(&models.SceneCreateInput{
		Title: &title, ImageIds: []uuid.UUID{sceneOnly.ID, shared.ID},
	})
	require.NoError(t, err)
	_, err = s.createTestStudio(&models.StudioCreateInput{
		Name: s.generateStudioName(), ImageIds: []uuid.UUID{studioOnly.ID, shared.ID},
	})
	require.NoError(t, err)

	var performerIDs []string
	for range 2 {
		performer, err := s.createTestPerformer(&models.PerformerCreateInput{
			Name: s.generatePerformerName(), ImageIds: []uuid.UUID{shared.ID},
		})
		require.NoError(t, err)
		performerIDs = append(performerIDs, performer.ID)
	}
	for _, imageID := range []uuid.UUID{sceneOnly.ID, studioOnly.ID, shared.ID, unattached.ID} {
		s.categorize(imageID, models.ImageTypeEnumShotPortrait)
	}

	assert.Equal(t, countBefore+1, s.feedCount())
	feed := s.feedIDs(1, 100)
	assert.NotContains(t, feed, sceneOnly.ID)
	assert.NotContains(t, feed, studioOnly.ID)
	assert.NotContains(t, feed, unattached.ID)
	sharedCount := 0
	for _, id := range feed {
		if id == shared.ID {
			sharedCount++
		}
	}
	assert.Equal(t, 1, sharedCount, "a shared image is one review entry")

	// Filtering by either performer retains all attached performers.
	for _, performerID := range performerIDs {
		var response struct {
			QueryUnorganizedImages struct {
				Count  int
				Images []imageAttachments
			}
		}
		err := s.client.Post(`
			query($performer: ID!) {
				queryUnorganizedImages(input: { performer_id: $performer }) {
					count
					images { id performers { id } }
				}
			}`, &response, client.Var("performer", performerID))
		require.NoError(t, err)
		assert.Equal(t, 1, response.QueryUnorganizedImages.Count)
		require.Len(t, response.QueryUnorganizedImages.Images, 1)
		row := response.QueryUnorganizedImages.Images[0]
		assert.Equal(t, shared.ID.String(), row.ID)
		assert.ElementsMatch(t, []idObject{{ID: performerIDs[0]}, {ID: performerIDs[1]}}, row.Performers)
	}
}
