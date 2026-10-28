package imagetype

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stretchr/testify/require"
)

func TestVocabularyCacheReusesSnapshotUntilCleared(t *testing.T) {
	var cache vocabularyCache
	first, second := testVocabulary(), testVocabulary()
	calls := 0
	load := func() (*vocabulary, error) {
		calls++
		if calls == 1 {
			return first, nil
		}
		return second, nil
	}

	got, err := cache.get(load)
	require.NoError(t, err)
	require.Same(t, first, got)

	got, err = cache.get(load)
	require.NoError(t, err)
	require.Same(t, first, got)
	require.Equal(t, 1, calls)

	cache.clear()
	got, err = cache.get(load)
	require.NoError(t, err)
	require.Same(t, second, got)
	require.Equal(t, 2, calls)
}

func TestVocabularyCacheCoalescesConcurrentLoads(t *testing.T) {
	var cache vocabularyCache
	var calls atomic.Int32
	snapshot := testVocabulary()
	const count = 32
	results := make([]*vocabulary, count)
	errs := make([]error, count)
	var wg sync.WaitGroup
	start := make(chan struct{})

	for i := range count {
		wg.Go(func() {
			<-start
			results[i], errs[i] = cache.get(func() (*vocabulary, error) {
				calls.Add(1)
				return snapshot, nil
			})
		})
	}
	close(start)
	wg.Wait()

	require.EqualValues(t, 1, calls.Load())
	for i := range count {
		require.NoError(t, errs[i])
		require.Same(t, snapshot, results[i])
	}
}

func TestVocabularyCacheRetriesFailedRefresh(t *testing.T) {
	var cache vocabularyCache
	previous := testVocabulary()
	_, err := cache.get(func() (*vocabulary, error) { return previous, nil })
	require.NoError(t, err)
	cache.clear()

	failure := errors.New("database unavailable")
	got, err := cache.get(func() (*vocabulary, error) { return nil, failure })
	require.ErrorIs(t, err, failure)
	require.Nil(t, got)

	fresh := testVocabulary()
	got, err = cache.get(func() (*vocabulary, error) { return fresh, nil })
	require.NoError(t, err)
	require.Same(t, fresh, got)
}

func TestInstanceRankingSharedAcrossServices(t *testing.T) {
	previous := instanceVocabularyCache
	instanceVocabularyCache = &vocabularyCache{}
	t.Cleanup(func() { instanceVocabularyCache = previous })
	snapshot := testVocabulary()
	_, err := instanceVocabularyCache.get(func() (*vocabulary, error) { return snapshot, nil })
	require.NoError(t, err)

	// Nil queriers ensure a cache hit does not touch either service's database.
	first := NewImageType(nil, nil)
	second := NewImageType(nil, nil)
	for _, service := range []*ImageType{first, second} {
		got, err := service.InstanceRanking(context.Background())
		require.NoError(t, err)
		require.Same(t, snapshot.ranking, got)
	}
}

func testVocabulary() *vocabulary {
	return &vocabulary{ranking: testRanking()}
}

func fullVocabulary(t *testing.T) *vocabulary {
	t.Helper()
	snapshot, err := buildVocabulary(
		[]queries.ImageTypeGroup{
			{Key: "CROP", Name: "Crop", Description: new("Crop description"), Enabled: true, Exclusive: true},
			{Key: "DRESS", Name: "Dress", SortOrder: 1, Enabled: true, Exclusive: true},
			{Key: "POSTURE", Name: "Posture", SortOrder: 2, Enabled: false, Exclusive: true},
		},
		[]queries.ImageType{
			{Key: "CROP_FACE", Name: "Face", Description: new("Face description"), GroupKey: "CROP", EntityType: "PERFORMER", Enabled: true, Conflicts: []string{"DRESS_TOPLESS"}},
			{Key: "CROP_BUST", Name: "Bust", GroupKey: "CROP", EntityType: "PERFORMER", SortOrder: 1, Enabled: false},
			{Key: "CROP_WIDE", Name: "Wide", GroupKey: "CROP", EntityType: "SCENE", SortOrder: 2, Enabled: true},
			{Key: "DRESS_TOPLESS", Name: "Topless", GroupKey: "DRESS", EntityType: "PERFORMER", Enabled: true},
			{Key: "POSTURE_STANDING", Name: "Standing", GroupKey: "POSTURE", EntityType: "PERFORMER", Enabled: true},
		},
	)
	require.NoError(t, err)
	return snapshot
}

func TestVocabularyConsumersShareCache(t *testing.T) {
	previous := instanceVocabularyCache
	snapshot := fullVocabulary(t)
	instanceVocabularyCache = &vocabularyCache{vocabulary: snapshot}
	t.Cleanup(func() { instanceVocabularyCache = previous })

	// All three consumers must work without a database once the snapshot is cached.
	first, second := NewImageType(nil, nil), NewImageType(nil, nil)
	groups, err := first.Groups(context.Background(), nil, true)
	require.NoError(t, err)
	require.Len(t, groups, 3)
	ranking, err := second.InstanceRanking(context.Background())
	require.NoError(t, err)
	require.Same(t, snapshot.ranking, ranking)
	require.NoError(t, ValidateImageAssignment(context.Background(), nil, uuid.Nil, []models.ImageTypeEnum{models.ImageTypeEnumCropFace}, nil, nil))
	require.ErrorContains(t, ValidateImageAssignment(context.Background(), nil, uuid.Nil, []models.ImageTypeEnum{models.ImageTypeEnumCropBust}, nil, nil), "not enabled")
	require.ErrorContains(t, ValidateImageAssignment(context.Background(), nil, uuid.Nil, []models.ImageTypeEnum{models.ImageTypeEnumCropFace, models.ImageTypeEnumDressTopless}, nil, nil), "cannot be both")
}

func TestCachedGroupsKeepFilteringIndependent(t *testing.T) {
	snapshot := fullVocabulary(t)
	performer, scene := models.ImageTypeScopeEnumPerformer, models.ImageTypeScopeEnumScene
	groups := snapshot.filteredGroups(&performer, false)
	require.Len(t, groups, 2)
	require.Equal(t, models.ImageTypeGroupEnumCrop, groups[0].Key)
	require.Len(t, groups[0].Types, 1)
	require.Equal(t, models.ImageTypeEnumCropFace, groups[0].Types[0].Key)
	require.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumDressTopless}, groups[0].Types[0].ConflictsWith)
	require.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumCropFace}, groups[1].Types[0].ConflictsWith)

	groups = snapshot.filteredGroups(&scene, false)
	require.Len(t, groups, 1)
	require.Len(t, groups[0].Types, 1)
	require.Equal(t, models.ImageTypeEnumCropWide, groups[0].Types[0].Key)

	groups = snapshot.filteredGroups(nil, true)
	require.Len(t, groups, 3)
	require.Len(t, groups[0].Types, 3)
	require.False(t, groups[0].Types[1].Enabled)
	require.False(t, groups[2].Enabled)
	require.True(t, groups[2].Types[0].Enabled)
	require.Empty(t, snapshot.filteredGroups(new(models.ImageTypeScopeEnumStudio), true))
}

func TestCachedGroupResultsDoNotExposeSnapshot(t *testing.T) {
	snapshot := fullVocabulary(t)
	groups := snapshot.filteredGroups(nil, true)
	groups[0].Name = "changed"
	*groups[0].Description = "changed"
	groups[0].Types[0].Name = "changed"
	*groups[0].Types[0].Description = "changed"
	groups[0].Types[0].ConflictsWith[0] = models.ImageTypeEnumCropWide
	groups[0].Types = nil

	fresh := snapshot.filteredGroups(nil, true)
	require.Equal(t, "Crop", fresh[0].Name)
	require.Equal(t, "Crop description", *fresh[0].Description)
	require.Len(t, fresh[0].Types, 3)
	require.Equal(t, "Face", fresh[0].Types[0].Name)
	require.Equal(t, "Face description", *fresh[0].Types[0].Description)
	require.Equal(t, []models.ImageTypeEnum{models.ImageTypeEnumDressTopless}, fresh[0].Types[0].ConflictsWith)
}
