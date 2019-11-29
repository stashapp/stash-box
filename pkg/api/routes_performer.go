package api

import (
	"context"
	"net/http"

    "github.com/satori/go.uuid"
	"github.com/go-chi/chi"
	"github.com/stashapp/stashdb/pkg/models"
)

type performerRoutes struct{}

func (rs performerRoutes) Routes() chi.Router {
	r := chi.NewRouter()

	r.Route("/{performerId}", func(r chi.Router) {
		r.Use(PerformerCtx)
		r.Get("/image", rs.Image)
	})

	return r
}

func (rs performerRoutes) Image(w http.ResponseWriter, r *http.Request) {
	if err := validateRead(r.Context()); err != nil {
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		return
	}

	performer := r.Context().Value(performerKey).(*models.Performer)
	_, _ = w.Write(performer.Image)
}

func PerformerCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		performerID, err := uuid.FromString(chi.URLParam(r, "performerId"))
		if err != nil {
			http.Error(w, http.StatusText(404), 404)
			return
		}

		qb := models.NewPerformerQueryBuilder(nil)
		performer, err := qb.Find(performerID)
		if err != nil {
			http.Error(w, http.StatusText(404), 404)
			return
		}

		ctx := context.WithValue(r.Context(), performerKey, performer)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
