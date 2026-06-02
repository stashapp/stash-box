package auth

import (
	"sync"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
)

// AuthUser is the slim, auth-scoped projection of models.User cached per
// request. It contains only the fields the auth path (and lightweight UI
// affordances like the navbar) actually needs. Resolvers that require
// Email/PasswordHash/etc. must fetch the full models.User from the database;
// see resolver_query_user.go's Me for the canonical pattern.
type AuthUser struct { //nolint:revive // distinct from models.User on purpose
	ID     uuid.UUID
	Name   string
	APIKey string
}

// var (not const) so tests can shrink them.
var cacheTTL = 30 * time.Second

// Must outlast any in-flight FindWithRoles whose MVCC snapshot predates an
// invalidating UPDATE; otherwise that read can re-populate the cache with the
// pre-mutation value.
var tombstoneTTL = 5 * time.Second

type cachedAuth struct {
	user    AuthUser
	roles   []models.RoleEnum
	expires time.Time
}

var (
	authCache  sync.Map // map[uuid.UUID]*cachedAuth
	tombstones sync.Map // map[uuid.UUID]time.Time
)

func CacheGet(id uuid.UUID) (*AuthUser, []models.RoleEnum, bool) {
	v, ok := authCache.Load(id)
	if !ok {
		return nil, nil, false
	}
	e := v.(*cachedAuth)
	if time.Now().After(e.expires) {
		authCache.Delete(id)
		return nil, nil, false
	}
	u := e.user
	return &u, e.roles, true
}

func CacheSet(user *AuthUser, roles []models.RoleEnum) {
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
		user:    *user,
		roles:   roles,
		expires: time.Now().Add(cacheTTL),
	})
}

func CacheInvalidate(id uuid.UUID) {
	tombstones.Store(id, time.Now().Add(tombstoneTTL))
	authCache.Delete(id)
}

// FromUser projects a models.User into the slim cached form.
func FromUser(u *models.User) *AuthUser {
	if u == nil {
		return nil
	}
	return &AuthUser{ID: u.ID, Name: u.Name, APIKey: u.APIKey}
}
