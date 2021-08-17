package api

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"path"
	"runtime/debug"
	"strconv"
	"strings"

	gqlHandler "github.com/99designs/gqlgen/graphql/handler"
	gqlExtension "github.com/99designs/gqlgen/graphql/handler/extension"
	gqlTransport "github.com/99designs/gqlgen/graphql/handler/transport"
	gqlPlayground "github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/gobuffalo/packr/v2"
	"github.com/rs/cors"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/manager/paths"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

var version = "0.0.0"
var buildstamp string
var githash string

var uiBox *packr.Box

const APIKeyHeader = "ApiKey"

func getUserAndRoles(fac models.Repo, userID string) (*models.User, []models.RoleEnum, error) {
	u, err := user.Get(fac, userID)
	if err != nil {
		return nil, nil, err
	}

	roles, err := user.GetRoles(fac, userID)
	if err != nil {
		return nil, nil, err
	}

	return u, roles, nil
}

func authenticateHandler() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			// translate api key into current user, if present
			userID := ""
			apiKey := r.Header.Get(APIKeyHeader)
			var err error
			if apiKey != "" {
				userID, err = user.GetUserIDFromAPIKey(apiKey)
			} else {
				// handle session
				userID, err = getSessionUserID(w, r)
			}

			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				_, err = w.Write([]byte(err.Error()))
				if err != nil {
					logger.Error(err)
				}
				return
			}

			u, roles, err := getUserAndRoles(getRepo(ctx), userID)

			// ensure api key of the user matches the passed one
			if apiKey != "" && u != nil && u.APIKey != apiKey {
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(err.Error()))
				return
			}

			// TODO - increment api key counters

			ctx = context.WithValue(ctx, user.ContextUser, u)
			ctx = context.WithValue(ctx, user.ContextRoles, roles)

			r = r.WithContext(ctx)

			next.ServeHTTP(w, r)
		})
	}
}

func redirect(w http.ResponseWriter, req *http.Request) {
	target := "https://" + req.Host + req.URL.Path
	if len(req.URL.RawQuery) > 0 {
		target += "?" + req.URL.RawQuery
	}
	http.Redirect(w, req, target, http.StatusPermanentRedirect)
}

func Start(rfp RepoProvider) {
	uiBox = packr.New("Setup UI Box", "../../frontend/build")

	r := chi.NewRouter()

	var corsConfig *cors.Cors
	if config.GetIsProduction() {
		corsConfig = cors.AllowAll()
	} else {
		corsConfig = cors.New(cors.Options{
			AllowOriginFunc:  func(origin string) bool { return true },
			AllowCredentials: true,
			AllowedHeaders:   []string{"*"},
		})
	}

	r.Use(corsConfig.Handler)
	r.Use(repoMiddleware(rfp))
	r.Use(authenticateHandler())
	r.Use(middleware.Recoverer)

	r.Use(middleware.DefaultCompress)
	r.Use(middleware.StripSlashes)
	r.Use(BaseURLMiddleware)

	recoverFunc := func(ctx context.Context, err interface{}) error {
		logger.Error(err)
		debug.PrintStack()

		message := fmt.Sprintf("Internal system error. Error <%v>", err)
		return errors.New(message)
	}

	gqlSrv := gqlHandler.New(models.NewExecutableSchema(models.Config{Resolvers: NewResolver(getRepo)}))
	gqlSrv.SetRecoverFunc(recoverFunc)
	gqlSrv.AddTransport(gqlTransport.Options{})
	gqlSrv.AddTransport(gqlTransport.GET{})
	gqlSrv.AddTransport(gqlTransport.POST{})
	gqlSrv.AddTransport(gqlTransport.MultipartForm{})
	gqlSrv.Use(gqlExtension.Introspection{})

	r.Handle("/graphql", dataloader.Middleware(rfp.Repo())(gqlSrv))

	if !config.GetIsProduction() {
		r.Handle("/playground", gqlPlayground.Handler("GraphQL playground", "/graphql"))
	}

	// session handlers
	r.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			data, _ := uiBox.Find("index.html")
			_, _ = w.Write(data)
			return
		}

		handleLogin(w, r)
	})
	r.HandleFunc("/logout", handleLogout)

	r.Mount("/image", imageRoutes{}.Routes())

	// Serve the web app
	r.HandleFunc("/*", func(w http.ResponseWriter, r *http.Request) {
		ext := path.Ext(r.URL.Path)
		if ext == ".html" || ext == "" {
			data, _ := uiBox.Find("index.html")
			_, _ = w.Write(data)
		} else {
			isStatic, _ := path.Match("/static/*/*", r.URL.Path)
			if isStatic {
				w.Header().Add("Cache-Control", "max-age=604800000")
			}
			http.FileServer(uiBox).ServeHTTP(w, r)
		}
	})

	address := config.GetHost() + ":" + strconv.Itoa(config.GetPort())
	if tlsConfig := makeTLSConfig(); tlsConfig != nil {
		httpsServer := &http.Server{
			Addr:      address,
			Handler:   r,
			TLSConfig: tlsConfig,
		}

		if config.GetHTTPUpgrade() {
			go func() {
				logger.Fatal(http.ListenAndServe(config.GetHost()+":80", http.HandlerFunc(redirect)))
			}()
		}

		go func() {
			printVersion()
			logger.Infof("stash-box is running on HTTPS at https://" + address + "/")
			logger.Fatal(httpsServer.ListenAndServeTLS("", ""))
		}()
	} else {
		server := &http.Server{
			Addr:    address,
			Handler: r,
		}

		go func() {
			printVersion()
			logger.Infof("stash-box is running on HTTP at http://" + address + "/")
			logger.Fatal(server.ListenAndServe())
		}()
	}
}

func printVersion() {
	fmt.Printf("stash-box version: %s (%s)\n", githash, buildstamp)
}

func GetVersion() (string, string, string) {
	return version, githash, buildstamp
}

func makeTLSConfig() *tls.Config {
	cert, err := ioutil.ReadFile(paths.GetSSLCert())
	if err != nil {
		return nil
	}

	key, err := ioutil.ReadFile(paths.GetSSLKey())
	if err != nil {
		return nil
	}

	certs := make([]tls.Certificate, 1)
	certs[0], err = tls.X509KeyPair(cert, key)
	if err != nil {
		return nil
	}
	tlsConfig := &tls.Config{
		Certificates: certs,
	}

	return tlsConfig
}

type contextKey struct {
	name string
}

var (
	BaseURLCtxKey = &contextKey{"BaseURL"}
)

func BaseURLMiddleware(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		var scheme string
		if strings.Compare("https", r.URL.Scheme) == 0 || r.Proto == "HTTP/2.0" || r.Header.Get("X-Forwarded-Proto") == "https" {
			scheme = "https"
		} else {
			scheme = "http"
		}
		baseURL := scheme + "://" + r.Host

		r = r.WithContext(context.WithValue(ctx, BaseURLCtxKey, baseURL))

		next.ServeHTTP(w, r)
	}
	return http.HandlerFunc(fn)
}
