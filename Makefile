LDFLAGS := $(LDFLAGS)
export CGO_ENABLED = 0

.PHONY: \
	stash-box \
	generate-backend \
	generate-ui \
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

stash-box: pre-ui ui build

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
	$(eval LDFLAGS := $(LDFLAGS) -X 'github.com/stashapp/stash-box/pkg/api.version=$(STASH_BOX_VERSION)' -X 'github.com/stashapp/stash-box/pkg/api.buildstamp=$(BUILD_DATE)' -X 'github.com/stashapp/stash-box/pkg/api.githash=$(GITHASH)' -X 'github.com/stashapp/stash-box/pkg/api.buildtype=$(BUILD_TYPE)')
	go build $(OUTPUT) -v -ldflags "$(LDFLAGS) $(EXTRA_LDFLAGS)"

build-release-static: EXTRA_LDFLAGS := -extldflags=-static -s -w
build-release-static: build

# Regenerates GraphQL files
generate: generate-backend generate-ui

clean:
	@ rm -rf stash-box frontend/node_modules frontend/build dist

generate-backend:
	go generate

generate-ui:
	cd frontend && yarn generate

generate-dataloaders:
	cd pkg/dataloader; \
		go run github.com/vektah/dataloaden UUIDsLoader github.com/gofrs/uuid.UUID "[]github.com/gofrs/uuid.UUID"; \
		go run github.com/vektah/dataloaden URLLoader github.com/gofrs/uuid.UUID "[]*github.com/stashapp/stash-box/pkg/models.URL"; \
		go run github.com/vektah/dataloaden TagLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/pkg/models.Tag"; \
		go run github.com/vektah/dataloaden StringsLoader github.com/gofrs/uuid.UUID "[]string"; \
		go run github.com/vektah/dataloaden SceneAppearancesLoader github.com/gofrs/uuid.UUID "github.com/stashapp/stash-box/pkg/models.PerformersScenes"; \
		go run github.com/vektah/dataloaden PerformerLoader  github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/pkg/models.Performer"; \
		go run github.com/vektah/dataloaden ImageLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/pkg/models.Image"; \
		go run github.com/vektah/dataloaden FingerprintsLoader github.com/gofrs/uuid.UUID "[]*github.com/stashapp/stash-box/pkg/models.Fingerprint"; \
		go run github.com/vektah/dataloaden SubmittedFingerprintsLoader github.com/gofrs/uuid.UUID "[]*github.com/stashapp/stash-box/pkg/models.Fingerprint"; \
		go run github.com/vektah/dataloaden BodyModificationsLoader github.com/gofrs/uuid.UUID "[]*github.com/stashapp/stash-box/pkg/models.BodyModification"; \
		go run github.com/vektah/dataloaden TagCategoryLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/pkg/models.TagCategory"; \
		go run github.com/vektah/dataloaden SiteLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/pkg/models.Site";

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
	cd frontend && yarn install --frozen-lockfile

ui:
	cd frontend && yarn build

ui-start:
	cd frontend && yarn start

ui-fmt:
	cd frontend && yarn format

# runs tests and checks on the UI and builds it
ui-validate:
	cd frontend && yarn run validate

# cross-compile- targets should be run within the compiler docker container
cross-compile-windows: export GOOS := windows
cross-compile-windows: export GOARCH := amd64
cross-compile-windows: export CC := x86_64-w64-mingw32-gcc
cross-compile-windows: export CXX := x86_64-w64-mingw32-g++
cross-compile-windows: OUTPUT := -o dist/stash-box-windows.exe
cross-compile-windows: build-release-static

cross-compile-linux: export GOOS := linux
cross-compile-linux: export GOARCH := amd64
cross-compile-linux: OUTPUT := -o dist/stash-box-linux
cross-compile-linux: build-release-static

cross-compile:
	make cross-compile-windows
	make cross-compile-linux
