package api

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
)

// frontendRoutes serves an on-disk SPA build mounted at a configurable prefix,
// alongside the embedded UI served by rootRoutes at /.
type frontendRoutes struct {
	dir    string
	prefix string
	index  []byte
}

func (fr frontendRoutes) Routes() chi.Router {
	fr.index = getDiskIndex(fr.dir)

	r := chi.NewRouter()

	// The URL still carries the mount prefix here, so strip it before
	// resolving paths against the build directory.
	fileServer := http.StripPrefix(fr.prefix, http.FileServer(http.Dir(fr.dir)))
	assets := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Cache-Control", "max-age=604800000")
		fileServer.ServeHTTP(w, r)
	}

	r.HandleFunc("/assets/*", assets)
	r.HandleFunc("/favicon.ico", assets)
	r.HandleFunc("/manifest.json", assets)

	r.HandleFunc("/*", fr.app)

	return r
}

func (fr frontendRoutes) app(w http.ResponseWriter, r *http.Request) {
	writeAppHeaders(w)
	_, _ = w.Write(fr.index)
}

func getDiskIndex(dir string) []byte {
	indexFile, err := os.ReadFile(filepath.Join(dir, "index.html"))
	if err != nil {
		panic(error.Error(err))
	}
	return renderIndex(indexFile)
}
