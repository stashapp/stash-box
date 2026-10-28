package imagetype

import (
	"context"
	"sync"
)

var instanceVocabularyCache = &vocabularyCache{}

type vocabularyCache struct {
	mu         sync.Mutex
	vocabulary *Vocabulary
}

func (c *vocabularyCache) get(load func() (*Vocabulary, error)) (*Vocabulary, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.vocabulary != nil {
		return c.vocabulary, nil
	}

	vocabulary, err := load()
	if err != nil {
		return nil, err
	}

	c.vocabulary = vocabulary
	return vocabulary, nil
}

func (c *vocabularyCache) clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.vocabulary = nil
}

// InstanceVocabulary returns the shared instance ranking snapshot.
func (s *ImageType) InstanceVocabulary(ctx context.Context) (*Vocabulary, error) {
	return instanceVocabularyCache.get(func() (*Vocabulary, error) {
		return loadVocabulary(ctx, s.queries)
	})
}
