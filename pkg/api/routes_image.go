package api

import (
	"net/http"

	"github.com/go-chi/chi"
	"github.com/stashapp/stashdb/pkg/image"
	"github.com/stashapp/stashdb/pkg/manager/config"
)

type imageRoutes struct{}

func (rs imageRoutes) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/{checksum}", rs.Image)

	return r
}

func (rs imageRoutes) Image(w http.ResponseWriter, r *http.Request) {
	checksum := chi.URLParam(r, "checksum")

	if err := config.ValidateImageLocation(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	http.ServeFile(w, r, image.GetImagePath(config.GetImageLocation(), checksum))
}
