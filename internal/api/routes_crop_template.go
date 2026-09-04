package api

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/stashapp/stash-box/internal/image/croptemplate"
	"github.com/stashapp/stash-box/pkg/logger"
)

// Only the loader, not the whole factory: this route touches no database, and
// the narrower dependency is what lets it be tested without one
type cropTemplateRoutes struct {
	templates *croptemplate.Loader
}

func (rs cropTemplateRoutes) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/{key}", rs.template)
	return r
}

// template streams a crop template for someone cropping in their own editor
//
// Served, not generated: these are the bytes the overlay in the edit form was
// parsed from, so the frame a contributor drags here and the one they drag in
// Photoshop are the same
func (rs cropTemplateRoutes) template(w http.ResponseWriter, r *http.Request) {
	key := strings.TrimSuffix(chi.URLParam(r, "key"), croptemplate.TemplateExt)

	data, ok := rs.templates.Bytes(key)
	if !ok {
		http.Error(w, "no such crop template", http.StatusNotFound)
		return
	}

	// The registered type for Photoshop documents. Browsers do not preview
	// it, which is right: this is a file to open in an editor, not to view
	w.Header().Set("Content-Type", "image/vnd.adobe.photoshop")
	// The Content-Type above is only worth stating if it is also believed
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Disposition",
		"attachment; filename=\""+key+croptemplate.TemplateExt+"\"")
	// Templates are baked into the binary, so they only change with a release
	w.Header().Set("Cache-Control", "public, max-age=3600")

	if _, err := w.Write(data); err != nil {
		logger.Errorf("writing crop template %s: %v", key, err)
	}
}
