package imagetype

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestVocabularyCacheReusesSnapshotUntilCleared(t *testing.T) {
	var cache vocabularyCache
	first, second := testVocabulary(), testVocabulary()
	calls := 0
	load := func() (*Vocabulary, error) {
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
	vocabulary := testVocabulary()
	const count = 32
	results := make([]*Vocabulary, count)
	errs := make([]error, count)
	var wg sync.WaitGroup
	start := make(chan struct{})

	for i := range count {
		wg.Go(func() {
			<-start
			results[i], errs[i] = cache.get(func() (*Vocabulary, error) {
				calls.Add(1)
				return vocabulary, nil
			})
		})
	}
	close(start)
	wg.Wait()

	require.EqualValues(t, 1, calls.Load())
	for i := range count {
		require.NoError(t, errs[i])
		require.Same(t, vocabulary, results[i])
	}
}

func TestVocabularyCacheRetriesFailedRefresh(t *testing.T) {
	var cache vocabularyCache
	previous := testVocabulary()
	_, err := cache.get(func() (*Vocabulary, error) { return previous, nil })
	require.NoError(t, err)
	cache.clear()

	failure := errors.New("database unavailable")
	got, err := cache.get(func() (*Vocabulary, error) { return nil, failure })
	require.ErrorIs(t, err, failure)
	require.Nil(t, got)

	fresh := testVocabulary()
	got, err = cache.get(func() (*Vocabulary, error) { return fresh, nil })
	require.NoError(t, err)
	require.Same(t, fresh, got)
}

func TestInstanceVocabularySharedAcrossServices(t *testing.T) {
	previous := instanceVocabularyCache
	instanceVocabularyCache = &vocabularyCache{}
	t.Cleanup(func() { instanceVocabularyCache = previous })
	vocabulary := testVocabulary()
	_, err := instanceVocabularyCache.get(func() (*Vocabulary, error) { return vocabulary, nil })
	require.NoError(t, err)

	// Nil queriers ensure a cache hit does not touch either service's database.
	first := NewImageType(nil, nil)
	second := NewImageType(nil, nil)
	for _, service := range []*ImageType{first, second} {
		got, err := service.InstanceVocabulary(context.Background())
		require.NoError(t, err)
		require.Same(t, vocabulary, got)
	}
}
