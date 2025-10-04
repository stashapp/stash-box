package api

import (
	"context"
	"crypto/tls"
	"embed"
	"errors"
	"fmt"
	"net/http"
	"net/http/pprof"
	"os"
	"runtime/debug"
	"strconv"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/klauspost/compress/flate"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"github.com/ravilushqa/otelgqlgen"

	"github.com/99designs/gqlgen/graphql"
	gqlHandler "github.com/99designs/gqlgen/graphql/handler"
	gqlExtension "github.com/99designs/gqlgen/graphql/handler/extension"
	gqlTransport "github.com/99designs/gqlgen/graphql/handler/transport"
	gqlPlayground "github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/riandyrn/otelchi"
	"github.com/rs/cors"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/service"
	"github.com/stashapp/stash-box/internal/service/user"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/manager/paths"
	"github.com/stashapp/stash-box/pkg/models"
)

var version string
var buildstamp string
var githash string
var buildtype string

const APIKeyHeader = "ApiKey"

func getUserAndRoles(ctx context.Context, fac service.Factory, userID string) (*models.User, []models.RoleEnum, error) {
	if userID == "" {
		return nil, nil, nil
	}
	id, err := uuid.FromString(userID)
	if err != nil {
		return nil, nil, err
	}
	u, err := fac.User().FindByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}

	roles, err := fac.User().GetRoles(ctx, id)
	if err != nil {
		return nil, nil, err
	}

	return u, roles, nil
}

func authenticateHandler(fac service.Factory) func(http.Handler) http.Handler {
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

			var u *models.User
			var roles []models.RoleEnum
			if err == nil {
				u, roles, err = getUserAndRoles(ctx, fac, userID)
			}

			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				_, err = w.Write([]byte(err.Error()))
				if err != nil {
					logger.Error(err)
				}
				return
			}

			// ensure api key of the user matches the passed one
			if apiKey != "" && u != nil && u.APIKey != apiKey {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			// TODO - increment api key counters

			ctx = context.WithValue(ctx, auth.ContextUser, u)
			ctx = context.WithValue(ctx, auth.ContextRoles, roles)

			span := trace.SpanFromContext(ctx)
			if span.SpanContext().IsValid() && u != nil {
				span.SetAttributes(attribute.String("user.id", u.ID.String()))
			}

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

func Start(fac service.Factory, ui embed.FS) {
	r := chi.NewRouter()
	r.Use(otelchi.Middleware("", otelchi.WithChiRoutes(r)))

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
	r.Use(authenticateHandler(fac))
	r.Use(middleware.Recoverer)

	compressor := middleware.NewCompressor(flate.DefaultCompression)
	r.Use(compressor.Handler)
	r.Use(middleware.StripSlashes)
	r.Use(BaseURLMiddleware)

	recoverFunc := func(ctx context.Context, err interface{}) error {
		logger.Error(err)
		debug.PrintStack()

		message := fmt.Sprintf("Internal system error. Error <%v>", err)
		return errors.New(message)
	}

	gqlConfig := models.Config{
		Resolvers: NewResolver(fac),
		Directives: models.DirectiveRoot{
			IsUserOwner: IsUserOwnerDirective,
			HasRole:     HasRoleDirective,
		},
	}
	gqlSrv := gqlHandler.New(models.NewExecutableSchema(gqlConfig))
	gqlSrv.SetRecoverFunc(recoverFunc)
	gqlSrv.AddTransport(gqlTransport.Options{})
	gqlSrv.AddTransport(gqlTransport.GET{})
	gqlSrv.AddTransport(gqlTransport.POST{})
	gqlSrv.AddTransport(gqlTransport.MultipartForm{})
	gqlSrv.Use(gqlExtension.Introspection{})
	gqlSrv.Use(otelgqlgen.Middleware(otelgqlgen.WithCreateSpanFromFields(func(fieldCtx *graphql.FieldContext) bool { return fieldCtx.IsResolver })))

	r.Handle("/graphql", dataloader.Middleware(fac)(gqlSrv))

	if !config.GetIsProduction() {
		r.Handle("/playground", gqlPlayground.Handler("GraphQL playground", "/graphql"))
	}

	r.Mount("/", rootRoutes{ui: ui}.Routes(fac))

	if config.GetProfilerPort() != nil {
		go func() {
			mux := http.NewServeMux()
			mux.HandleFunc("/", pprof.Index)
			mux.HandleFunc("/cmdline", pprof.Cmdline)
			mux.HandleFunc("/profile", pprof.Profile)
			mux.HandleFunc("/symbol", pprof.Symbol)
			mux.HandleFunc("/trace", pprof.Trace)
			mux.Handle("/allocs", pprof.Handler("allocs"))
			mux.Handle("/block", pprof.Handler("block"))
			mux.Handle("/goroutine", pprof.Handler("goroutine"))
			mux.Handle("/heap", pprof.Handler("heap"))
			mux.Handle("/mutex", pprof.Handler("mutex"))
			mux.Handle("/threadcreate", pprof.Handler("threadcreate"))
			logger.Infof("profiler is running at http://localhost:%d/", *config.GetProfilerPort())
			logger.Fatal(http.ListenAndServe(":"+strconv.Itoa(*config.GetProfilerPort()), mux))
		}()
	}

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
			logger.Infof("stash-box is running on HTTPS at https://%s/", address)
			logger.Fatal(httpsServer.ListenAndServeTLS("", ""))
		}()
	} else {
		server := &http.Server{
			Addr:    address,
			Handler: r,
		}

		go func() {
			printVersion()
			logger.Infof("stash-box is running on HTTP at http://%s/", address)
			logger.Fatal(server.ListenAndServe())
		}()
	}
}

func printVersion() {
	versionString := version
	if buildtype != "OFFICIAL" {
		versionString += " (" + githash + ")"
	}
	fmt.Printf("stash-box version: %s - %s\n", versionString, buildstamp)
}

func GetVersion() (string, string, string) {
	return version, githash, buildstamp
}

func makeTLSConfig() *tls.Config {
	cert, err := os.ReadFile(paths.GetSSLCert())
	if err != nil {
		return nil
	}

	key, err := os.ReadFile(paths.GetSSLKey())
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
		MinVersion:   tls.VersionTLS13,
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
