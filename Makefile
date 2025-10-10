LDFLAGS := $(LDFLAGS)

.PHONY: \
	stash-box \
	generate \
	generate-backend \
	generate-ui \
	generate-sqlc \
	generate-goverter \
	generate-dataloaders \
	test \
	it \
	fmt \
	lint \
	ui \
	ui-start \
	ui-fmt \
	ui-validate \
	pre-ui \
	clean

ifdef OUTPUT
  OUTPUT := -o $(OUTPUT)
endif

stash-box: pre-ui generate ui lint build

pre-build:
ifndef BUILD_DATE
	$(eval BUILD_DATE := $(shell go run scripts/getDate.go))
endif

ifndef GITHASH
	$(eval GITHASH := $(shell git rev-parse --short HEAD))
endif

ifndef STASH_BOX_VERSION
	$(eval STASH_BOX_VERSION := $(shell git describe --tags --abbrev=0 --exclude latest-develop))
endif

ifndef BUILD_TYPE
	$(eval BUILD_TYPE := LOCAL)
endif

build: pre-build
	$(eval LDFLAGS := $(LDFLAGS) -X 'github.com/stashapp/stash-box/internal/api.version=$(STASH_BOX_VERSION)' -X 'github.com/stashapp/stash-box/internal/api.buildstamp=$(BUILD_DATE)' -X 'github.com/stashapp/stash-box/internal/api.githash=$(GITHASH)' -X 'github.com/stashapp/stash-box/internal/api.buildtype=$(BUILD_TYPE)')
	go build $(OUTPUT) -v -ldflags "$(LDFLAGS) $(EXTRA_LDFLAGS)" ./cmd/stash-box

build-release-static: EXTRA_LDFLAGS := -extldflags=-static -s -w
build-release-static: build

# Regenerates GraphQL files and sqlc code
generate: generate-backend generate-ui generate-sqlc

clean:
	@ rm -rf stash-box frontend/node_modules frontend/build dist

generate-backend:
	@ go generate ./...

generate-ui:
	cd frontend && pnpm generate

generate-sqlc:
	sqlc generate

generate-goverter:
	go run github.com/jmattheis/goverter/cmd/goverter gen ./internal/converter/gen

generate-dataloaders:
	cd internal/dataloader; \
		go run github.com/vektah/dataloaden UUIDsLoader github.com/gofrs/uuid.UUID "[]github.com/gofrs/uuid.UUID"; \
		go run github.com/vektah/dataloaden URLLoader github.com/gofrs/uuid.UUID "[]github.com/stashapp/stash-box/internal/models.URL"; \
		go run github.com/vektah/dataloaden TagLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/internal/models.Tag"; \
		go run github.com/vektah/dataloaden StringsLoader github.com/gofrs/uuid.UUID "[]string"; \
		go run github.com/vektah/dataloaden SceneAppearancesLoader github.com/gofrs/uuid.UUID "[]github.com/stashapp/stash-box/internal/models.PerformerScene"; \
		go run github.com/vektah/dataloaden PerformerLoader  github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/internal/models.Performer"; \
		go run github.com/vektah/dataloaden ImageLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/internal/models.Image"; \
		go run github.com/vektah/dataloaden FingerprintsLoader github.com/gofrs/uuid.UUID "[]github.com/stashapp/stash-box/internal/models.Fingerprint"; \
		go run github.com/vektah/dataloaden SubmittedFingerprintsLoader github.com/gofrs/uuid.UUID "[]github.com/stashapp/stash-box/internal/models.Fingerprint"; \
		go run github.com/vektah/dataloaden BodyModificationsLoader github.com/gofrs/uuid.UUID "[]github.com/stashapp/stash-box/internal/models.BodyModification"; \
		go run github.com/vektah/dataloaden TagCategoryLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/internal/models.TagCategory"; \
		go run github.com/vektah/dataloaden SiteLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/internal/models.Site"; \
		go run github.com/vektah/dataloaden StudioLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/internal/models.Studio"; \
		go run github.com/vektah/dataloaden EditLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/internal/models.Edit"; \
		go run github.com/vektah/dataloaden EditCommentLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/internal/models.EditComment"; \
		go run github.com/vektah/dataloaden SceneLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/internal/models.Scene"; \
		go run github.com/vektah/dataloaden BoolsLoader github.com/gofrs/uuid.UUID "bool";

test:
	go test ./...

# Runs the integration tests. -count=1 is used to ensure results are not
# cached, which is important if the environment changes
it:
	go test -tags=integration -count=1 ./...

# Runs gofmt -w on the project's source code, modifying any files that do not match its style.
fmt:
	go fmt ./...

# Runs all configured linuters. golangci-lint needs to be installed locally first.
lint:
	golangci-lint run

pre-ui:
	cd frontend && pnpm install

ui:
	cd frontend && pnpm build

ui-start:
	cd frontend && pnpm start

ui-fmt:
	cd frontend && pnpm format

# runs tests and checks on the UI and builds it
ui-validate:
	cd frontend && pnpm run validate

# cross-compile- targets should be run within the compiler docker container
cross-compile-windows: export GOOS := windows
cross-compile-windows: export GOARCH := amd64
cross-compile-windows: export CC := x86_64-w64-mingw32-gcc
cross-compile-windows: export CXX := x86_64-w64-mingw32-g++
cross-compile-windows: export CGO_ENABLED = 0
cross-compile-windows: OUTPUT := -o dist/stash-box-windows.exe
cross-compile-windows: build-release-static

cross-compile-linux: export GOOS := linux
cross-compile-linux: export GOARCH := amd64
cross-compile-linux: OUTPUT := -o dist/stash-box-linux
cross-compile-linux: export CGO_ENABLED = 1
cross-compile-linux: build

cross-compile:
	make cross-compile-windows
	make cross-compile-linux
