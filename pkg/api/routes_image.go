package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager/config"
)

type imageRoutes struct{}

func (rs imageRoutes) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/{checksum}", rs.image)
	r.Get("/site/{uuid}", rs.siteImage)

	return r
}

func (rs imageRoutes) image(w http.ResponseWriter, r *http.Request) {
	checksum := chi.URLParam(r, "checksum")

	if err := config.ValidateImageLocation(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	http.ServeFile(w, r, image.GetImagePath(config.GetImageLocation(), checksum))
}

func (rs imageRoutes) siteImage(w http.ResponseWriter, r *http.Request) {
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

	data, err := image.GetSiteIcon(r.Context(), *site)
	if err != nil {
		logger.Error("Couldn't get favicon:", err)
	}

	if data == nil {
		w.Header().Add("Cache-Control", "max-age=86400")
		w.WriteHeader(http.StatusNotFound)
		return
	}

	w.Header().Add("Cache-Control", "max-age=604800000")
	//nolint
	w.Write(data)
}
