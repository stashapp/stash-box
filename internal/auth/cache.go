package auth

import (
	"sync"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
)

// cacheTTL bounds how long a stale entry can live if invalidation is missed.
// Explicit invalidation covers role changes, user deletion, and api-key rotation;
// TTL is the safety net for any path we forget.
const cacheTTL = 30 * time.Second

type cachedAuth struct {
	user    *models.User
	roles   []models.RoleEnum
	expires time.Time
}

var authCache sync.Map // map[uuid.UUID]*cachedAuth

// CacheGet returns the cached (user, roles) for id if a fresh entry exists.
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
	return e.user, e.roles, true
}

// CacheSet stores a fresh entry for the user. No-op if user is nil.
func CacheSet(user *models.User, roles []models.RoleEnum) {
	if user == nil {
		return
	}
	authCache.Store(user.ID, &cachedAuth{
		user:    user,
		roles:   roles,
		expires: time.Now().Add(cacheTTL),
	})
}

// CacheInvalidate removes the user's cached entry. Call after any change that
// affects auth: role mutation, user deletion, api-key rotation.
func CacheInvalidate(id uuid.UUID) {
	authCache.Delete(id)
}
