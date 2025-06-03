package api

import (
	"io"
	"net/http"
	"slices"
	"strconv"

	"github.com/stashapp/stash-box/pkg/models"

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

	requestedSize, err := getImageSize(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	cacheManager := image.GetCacheManager()

	// Check for cached image
	if requestedSize != 0 && cacheManager != nil {
		reader, err := cacheManager.Read(uuid, requestedSize)

		if err == nil {
			defer reader.Close()

			if _, err := io.Copy(w, reader); err != nil {
				logger.Debugf("failed to read cached image: %v", err)
				http.Error(w, err.Error(), http.StatusInternalServerError)
			} else {
				w.Header().Add("Cache-Control", "max-age=604800000")
				return
			}
		}
	}

	imageRepo := getRepo(r.Context()).Image()

	databaseImage, err := imageRepo.Find(uuid)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if databaseImage == nil {
		http.NotFound(w, r)
		return
	}

	service := image.GetService(imageRepo)
	reader, size, err := service.Read(*databaseImage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	defer reader.Close()

	if databaseImage.Width == -1 {
		w.Header().Add("Content-Type", "image/svg+xml")
	}
	w.Header().Add("Cache-Control", "max-age=604800000")

	// Resize image
	if shouldResize(databaseImage, requestedSize) {
		data, err := image.Resize(reader, requestedSize, databaseImage, size)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if _, err := w.Write(data); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		if cacheManager != nil {
			_ = cacheManager.Write(databaseImage.ID, requestedSize, data)
		}
		return
	}

	// Serve full image
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

// Limit allowed sizes to prevent abuse
var allowedSizes = []int{300, 600, 1280}

func getImageSize(r *http.Request) (int, error) {
	maxSize := 0
	querySize := r.FormValue("size")
	switch {
	case querySize == "full":
	// Skip resize
	case querySize != "":
		size, err := strconv.Atoi(querySize)
		if err != nil || !slices.Contains(allowedSizes, size) {
			return 0, err
		}
		return size, err
	case config.GetImageMaxSize() != nil:
		maxSize = *config.GetImageMaxSize()
	}

	return maxSize, nil
}

// shouldResize returns true if resize config is enabled, the size to resize to is not zero,
// the image is not below the minimum size to ignore, and the image is larger than the minimum
// size to resize down to.
func shouldResize(image *models.Image, requestedSize int) bool {
	config := config.GetImageResizeConfig()
	minSize := config.MinSize
	return config.Enabled && requestedSize != 0 &&
		(image.Width > minSize || image.Height > minSize) &&
		(image.Width > requestedSize || image.Height > requestedSize)
}
