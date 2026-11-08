package api

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/stashapp/stash-box/internal/image/croptemplate"
	"github.com/stashapp/stash-box/pkg/logger"
)

func cropTemplateRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/{key}", serveCropTemplate)
	return r
}

// serveCropTemplate downloads the file the overlay was parsed from, for cropping in an external editor
func serveCropTemplate(w http.ResponseWriter, r *http.Request) {
	key := strings.TrimSuffix(chi.URLParam(r, "key"), croptemplate.TemplateExt)

	data, ok := croptemplate.Bytes(key)
	if !ok {
		http.Error(w, "no such crop template", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "image/vnd.adobe.photoshop")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Disposition", "attachment; filename=\""+key+croptemplate.TemplateExt+"\"")
	// Templates are baked into the binary, so they only change with a release
	w.Header().Set("Cache-Control", "public, max-age=3600")

	if _, err := w.Write(data); err != nil {
		logger.Errorf("writing crop template %s: %v", key, err)
	}
}
