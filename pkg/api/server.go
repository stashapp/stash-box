package api

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"runtime/debug"
	"strconv"
	"strings"

	"github.com/99designs/gqlgen/handler"
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/gobuffalo/packr/v2"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"github.com/stashapp/stashdb/pkg/logger"
	"github.com/stashapp/stashdb/pkg/manager/config"
	"github.com/stashapp/stashdb/pkg/manager/paths"
	"github.com/stashapp/stashdb/pkg/models"
)

var buildstamp string = ""
var githash string = ""

var setupUIBox *packr.Box

const ApiKeyHeader = "ApiKey"
const ContextRole = "role"

func getRole(apiKey string) string {
	readApiKey := config.GetReadApiKey()
	modifyApiKey := config.GetModifyApiKey()

	// allow modification if both api keys are blanked
	if (modifyApiKey == "" && readApiKey == "") || apiKey == modifyApiKey {
		return ModifyRole
	}

	// allow read if read api key is blanked
	if readApiKey == "" || apiKey == readApiKey {
		return ReadRole
	}

	return ""
}

func authenticateHandler() func(http.Handler) http.Handler {

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			apiKey := r.Header.Get(ApiKeyHeader)

			// TODO - translate api key into current user
			// for now, set role based on config
			role := getRole(apiKey)

			// TODO - add config to allow playground
			// for now just let it through with blank role
			if role == "" {
				// w.WriteHeader(http.StatusUnauthorized)
				// w.Write([]byte("Missing API key"))
				// return
			}

			ctx := r.Context()
			r = r.WithContext(context.WithValue(ctx, ContextRole, role))

			next.ServeHTTP(w, r)
		})
	}
}

func Start() {
	setupUIBox = packr.New("Setup UI Box", "../../ui/setup")

	r := chi.NewRouter()

	r.Use(authenticateHandler())
	r.Use(middleware.Recoverer)

	r.Use(middleware.DefaultCompress)
	r.Use(middleware.StripSlashes)
	r.Use(cors.AllowAll().Handler)
	r.Use(BaseURLMiddleware)

	recoverFunc := handler.RecoverFunc(func(ctx context.Context, err interface{}) error {
		logger.Error(err)
		debug.PrintStack()

		message := fmt.Sprintf("Internal system error. Error <%v>", err)
		return errors.New(message)
	})
	requestMiddleware := handler.RequestMiddleware(func(ctx context.Context, next func(ctx context.Context) []byte) []byte {
		//api.GetRequestContext(ctx).Variables[]
		return next(ctx)
	})
	websocketUpgrader := handler.WebsocketUpgrader(websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	})
	gqlHandler := handler.GraphQL(models.NewExecutableSchema(models.Config{Resolvers: &Resolver{}}), recoverFunc, requestMiddleware, websocketUpgrader)

	r.Handle("/graphql", gqlHandler)

	// TODO - this should be disabled in production
	r.Handle("/playground", handler.Playground("GraphQL playground", "/graphql"))

	address := config.GetHost() + ":" + strconv.Itoa(config.GetPort())
	if tlsConfig := makeTLSConfig(); tlsConfig != nil {
		httpsServer := &http.Server{
			Addr:      address,
			Handler:   r,
			TLSConfig: tlsConfig,
		}

		go func() {
			printVersion()
			logger.Infof("stash is running on HTTPS at https://" + address + "/")
			logger.Fatal(httpsServer.ListenAndServeTLS("", ""))
		}()
	} else {
		server := &http.Server{
			Addr:    address,
			Handler: r,
		}

		go func() {
			printVersion()
			logger.Infof("stash is running on HTTP at http://" + address + "/")
			logger.Fatal(server.ListenAndServe())
		}()
	}
}

func printVersion() {
	fmt.Printf("stash version: %s (%s)\n", githash, buildstamp)
}

func GetVersion() (string, string) {
	return githash, buildstamp
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
