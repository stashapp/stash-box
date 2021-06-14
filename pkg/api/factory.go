package api

import (
	"context"
	"net/http"

	"github.com/stashapp/stash-box/pkg/models"
)

type RepoFactoryProvider interface {
	RepoFactory() models.RepoFactory
}

func repoFactoryMiddleware(provider RepoFactoryProvider) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r = r.WithContext(context.WithValue(r.Context(), contextRepoFactory, provider.RepoFactory()))

			next.ServeHTTP(w, r)
		})
	}
}

func getRepoFactory(ctx context.Context) models.RepoFactory {
	return ctx.Value(contextRepoFactory).(models.RepoFactory)
}
