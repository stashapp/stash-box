package api

import (
	"embed"
	"html/template"
	"io/fs"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/stashapp/stash-box/pkg/manager/config"
)

type rootRoutes struct {
	ui    embed.FS
	index []byte
}

func (rr rootRoutes) Routes() chi.Router {
	rr.index = getIndex(rr.ui)

	r := chi.NewRouter()

	// session handlers
	r.Post("/login", handleLogin)
	r.HandleFunc("/logout", handleLogout)

	r.Mount("/images", imageRoutes{}.Routes())

	// Serve static assets
	r.HandleFunc("/assets/*", rr.assets)
	r.HandleFunc("/favicon.ico", rr.assets)
	r.HandleFunc("/manifest.json", rr.assets)

	// Serve the web app
	r.HandleFunc("/*", rr.app)

	return r
}

func (rr rootRoutes) assets(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Cache-Control", "max-age=604800000")
	uiRoot, err := fs.Sub(rr.ui, "frontend/build")
	if err != nil {
		panic(error.Error(err))
	}
	http.FileServer(http.FS(uiRoot)).ServeHTTP(w, r)
}

func (rr rootRoutes) app(w http.ResponseWriter, r *http.Request) {
	csp := config.GetCSP()
	if csp != "" {
		w.Header().Add("Content-Security-Policy", csp)
	}
	w.Header().Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	w.Header().Add("X-Frame-Options", "SAMEORIGIN")
	w.Header().Add("X-Content-Type-Options", "nosniff")
	w.Header().Add("Referrer-Policy", "same-origin")
	w.Header().Add("Permissions-Policy", "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()")
	_, _ = w.Write(rr.index)
}

func getIndex(ui embed.FS) []byte {
	indexFile, err := ui.ReadFile("frontend/build/index.html")
	if err != nil {
		panic(error.Error(err))
	}
	tmpl := template.Must(template.New("index").Parse(string(indexFile)))
	title := template.HTMLEscapeString(config.GetTitle())
	output := new(strings.Builder)
	if err := tmpl.Execute(output, template.HTML(title)); err != nil {
		panic(error.Error(err))
	}
	return []byte(output.String())
}
