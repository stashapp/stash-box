package auth

import (
	"sync"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
)

// var (not const) so tests can shrink them.
var cacheTTL = 30 * time.Second

// Must outlast any in-flight FindWithRoles whose MVCC snapshot predates an
// invalidating UPDATE; otherwise that read can re-populate the cache with the
// pre-mutation value.
var tombstoneTTL = 5 * time.Second

// Only fields the auth path consults — so mutations to Email/PasswordHash/
// InviteTokens don't require cache invalidation.
type cachedAuth struct {
	id      uuid.UUID
	apiKey  string
	roles   []models.RoleEnum
	expires time.Time
}

var (
	authCache  sync.Map // map[uuid.UUID]*cachedAuth
	tombstones sync.Map // map[uuid.UUID]time.Time
)

func CacheGet(id uuid.UUID) (*models.User, []models.RoleEnum, bool) {
	v, ok := authCache.Load(id)
	if !ok {
		return nil, nil, false
	}
	e := v.(*cachedAuth)
	if time.Now().After(e.expires) {
		authCache.Delete(id)
		return nil, nil, false
	}
	return &models.User{ID: e.id, APIKey: e.apiKey}, e.roles, true
}

func CacheSet(user *models.User, roles []models.RoleEnum) {
	if user == nil {
		return
	}
	if t, ok := tombstones.Load(user.ID); ok {
		if time.Now().Before(t.(time.Time)) {
			return
		}
		tombstones.Delete(user.ID)
	}
	authCache.Store(user.ID, &cachedAuth{
		id:      user.ID,
		apiKey:  user.APIKey,
		roles:   roles,
		expires: time.Now().Add(cacheTTL),
	})
}

func CacheInvalidate(id uuid.UUID) {
	tombstones.Store(id, time.Now().Add(tombstoneTTL))
	authCache.Delete(id)
}
