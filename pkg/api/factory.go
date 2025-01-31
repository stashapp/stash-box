package api

import (
	"context"
	"net/http"

	"github.com/stashapp/stash-box/pkg/models"
)

type RepoProvider interface {
	// IMPORTANT: the returned Repo object MUST NOT be shared between goroutines.
	// that is: call Repo for each new request/goroutine
	Repo(ctx context.Context) models.Repo
}

// creates a new Repo (with its own transaction boundary) for each incoming request
func repoMiddleware(provider RepoProvider) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			r = r.WithContext(context.WithValue(ctx, ContextRepo, provider.Repo(ctx)))

			next.ServeHTTP(w, r)
		})
	}
}

func getRepo(ctx context.Context) models.Repo {
	return ctx.Value(ContextRepo).(models.Repo)
}
