package api

import (
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager/config"
)

type imageRoutes struct{}

func (rs imageRoutes) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/{uuid}", rs.image)
	r.Get("/site/{uuid}", rs.siteImage)

	return r
}

func (rs imageRoutes) image(w http.ResponseWriter, r *http.Request) {
	uuid, err := uuid.FromString(chi.URLParam(r, "uuid"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	imageRepo := getRepo(r.Context()).Image()

	databaseImage, err := imageRepo.Find(uuid)
	if err != nil || databaseImage == nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	service := image.GetService(imageRepo)
	reader, err := service.Read(*databaseImage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	defer reader.Close()

	if databaseImage.Width == -1 {
		w.Header().Add("Content-Type", "image/svg+xml")
	}

	w.Header().Add("Cache-Control", "max-age=604800000")

	maxSize := 0
	querySize := r.FormValue("size")
	switch {
	case querySize == "full":
	// Skip resize
	case querySize != "":
		maxSize, err = strconv.Atoi(querySize)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	case config.GetImageMaxSize() != nil:
		maxSize = *config.GetImageMaxSize()
	}

	if maxSize != 0 {
		if databaseImage.Width > int64(maxSize) || databaseImage.Height > int64(maxSize) {
			data, err := image.Resize(reader, maxSize)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if _, err := w.Write(data); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			return
		}
	}

	if _, err := io.Copy(w, reader); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
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
