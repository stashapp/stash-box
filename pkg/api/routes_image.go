package api

import (
	"net/http"

	"github.com/go-chi/chi"
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/image"
)

type imageRoutes struct{}

func (rs imageRoutes) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/site/{uuid}", rs.SiteImage)

	return r
}

func (rs imageRoutes) SiteImage(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "uuid")
	siteID, err := uuid.FromString(id)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	site, err := getRepo(r.Context()).Site().Find(siteID)
	if err != nil {
		return
	}

	data := image.GetSiteIcon(r.Context(), *site)

	if data == nil {
		w.Header().Add("Cache-Control", "max-age=86400")
		w.WriteHeader(http.StatusNotFound)
		return
	}

	w.Header().Add("Cache-Control", "max-age=604800000")
	//nolint
	w.Write(data)
}
