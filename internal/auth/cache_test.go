package auth

import (
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

func newID(t *testing.T) uuid.UUID {
	t.Helper()
	id, err := uuid.NewV4()
	if err != nil {
		t.Fatalf("uuid: %v", err)
	}
	return id
}

func withTTLs(t *testing.T, cache, tomb time.Duration) {
	t.Helper()
	origCache, origTomb := cacheTTL, tombstoneTTL
	cacheTTL = cache
	tombstoneTTL = tomb
	t.Cleanup(func() {
		cacheTTL = origCache
		tombstoneTTL = origTomb
	})
}

func TestCacheSetGetRoundtrip(t *testing.T) {
	id := newID(t)
	u := &AuthUser{ID: id, Name: "alice", APIKey: "k1"}
	roles := []models.RoleEnum{models.RoleEnumAdmin}

	CacheSet(u, roles)
	got, gotRoles, ok := CacheGet(id)

	assert.True(t, ok)
	assert.Equal(t, id, got.ID)
	assert.Equal(t, "alice", got.Name)
	assert.Equal(t, "k1", got.APIKey)
	assert.Equal(t, roles, gotRoles)
}

func TestCacheGetMiss(t *testing.T) {
	_, _, ok := CacheGet(newID(t))
	assert.False(t, ok)
}

func TestCacheSetNilIsNoop(t *testing.T) {
	CacheSet(nil, nil)
	// No panic, and nothing inserted under any predictable key — pass.
}

func TestCacheGetReturnsFreshPointer(t *testing.T) {
	id := newID(t)
	CacheSet(&AuthUser{ID: id, APIKey: "k1"}, nil)

	a, _, _ := CacheGet(id)
	b, _, _ := CacheGet(id)
	assert.NotSame(t, a, b, "each hit should allocate a new *AuthUser")

	a.APIKey = "mutated"
	c, _, _ := CacheGet(id)
	assert.Equal(t, "k1", c.APIKey, "mutating the returned pointer must not affect the cache")
}

func TestFromUserProjectsAuthFieldsOnly(t *testing.T) {
	id := newID(t)
	au := FromUser(&models.User{
		ID:           id,
		APIKey:       "k1",
		PasswordHash: "secret-hash",
		Email:        "user@example.com",
		Name:         "alice",
	})

	assert.Equal(t, id, au.ID)
	assert.Equal(t, "alice", au.Name)
	assert.Equal(t, "k1", au.APIKey)
	// Fields outside AuthUser cannot exist on the slim type — assertion is
	// "the type doesn't carry them" rather than "they were zeroed."
}

func TestFromUserNil(t *testing.T) {
	assert.Nil(t, FromUser(nil))
}

func TestCacheInvalidateRemovesEntry(t *testing.T) {
	id := newID(t)
	CacheSet(&AuthUser{ID: id, APIKey: "k1"}, nil)

	CacheInvalidate(id)

	_, _, ok := CacheGet(id)
	assert.False(t, ok)
}

func TestCacheTTLExpires(t *testing.T) {
	withTTLs(t, 10*time.Millisecond, 0)
	id := newID(t)
	CacheSet(&AuthUser{ID: id, APIKey: "k1"}, nil)

	time.Sleep(20 * time.Millisecond)

	_, _, ok := CacheGet(id)
	assert.False(t, ok, "entry past cacheTTL must miss")
}

func TestTombstoneBlocksConcurrentSet(t *testing.T) {
	withTTLs(t, 30*time.Second, 5*time.Second)
	id := newID(t)

	CacheInvalidate(id)
	// Simulates an in-flight FindWithRoles that returned the pre-invalidation
	// snapshot trying to re-populate the cache.
	CacheSet(&AuthUser{ID: id, APIKey: "stale"}, nil)

	_, _, ok := CacheGet(id)
	assert.False(t, ok, "tombstone must prevent re-cache after invalidation")
}

func TestTombstoneExpiresAndAllowsSet(t *testing.T) {
	withTTLs(t, 30*time.Second, 10*time.Millisecond)
	id := newID(t)

	CacheInvalidate(id)
	time.Sleep(20 * time.Millisecond)
	CacheSet(&AuthUser{ID: id, APIKey: "fresh"}, nil)

	got, _, ok := CacheGet(id)
	assert.True(t, ok, "after tombstone expires, CacheSet must succeed")
	assert.Equal(t, "fresh", got.APIKey)
}

func TestInvalidateAffectsOnlyTargetKey(t *testing.T) {
	a, b := newID(t), newID(t)
	CacheSet(&AuthUser{ID: a, APIKey: "ka"}, nil)
	CacheSet(&AuthUser{ID: b, APIKey: "kb"}, nil)

	CacheInvalidate(a)

	_, _, okA := CacheGet(a)
	_, _, okB := CacheGet(b)
	assert.False(t, okA)
	assert.True(t, okB)
}
