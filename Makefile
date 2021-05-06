IS_WIN =
ifeq (${SHELL}, sh.exe)
  IS_WIN = true
endif
ifeq (${SHELL}, cmd)
  IS_WIN = true
endif

ifdef IS_WIN
  SEPARATOR := &&
  SET := set
else 
  SEPARATOR := ;
  SET := export
endif

# set LDFLAGS environment variable to any extra ldflags required
# set OUTPUT to generate a specific binary name

LDFLAGS := $(LDFLAGS)
ifdef OUTPUT
  OUTPUT := -o $(OUTPUT)
endif

.PHONY: release pre-build install clean 

release: generate ui build-release

pre-build:
ifndef BUILD_DATE
	$(eval BUILD_DATE := $(shell go run scripts/getDate.go))
endif

ifndef GITHASH
	$(eval GITHASH := $(shell git rev-parse --short HEAD))
endif

ifndef STASH_BOX_VERSION
	$(eval STASH_BOX_VERSION := 0.0.0)
endif

build: pre-build
	$(eval LDFLAGS := $(LDFLAGS) -X 'github.com/stashapp/stash-box/pkg/api.version=$(STASH_BOX_VERSION)' -X 'github.com/stashapp/stash-box/pkg/api.buildstamp=$(BUILD_DATE)' -X 'github.com/stashapp/stash-box/pkg/api.githash=$(GITHASH)')
	$(SET) CGO_ENABLED=1 $(SEPARATOR) go build $(OUTPUT) -v -tags "osusergo netgo" -ldflags "$(LDFLAGS) $(EXTRA_LDFLAGS)"

# strips debug symbols from the release build
# consider -trimpath in go build if we move to go 1.13+
build-release: EXTRA_LDFLAGS := -s -w
build-release: build

build-release-static: EXTRA_LDFLAGS := -extldflags=-static -s -w
build-release-static: build

install:
	packr2 install

clean:
	packr2 clean

# Regenerates GraphQL files and packr files
.PHONY: generate
generate:
	go generate

.PHONY: generate-ui
generate-ui:
	cd frontend && yarn generate

.PHONY: generate-dataloaders
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
		go run github.com/vektah/dataloaden BodyModificationsLoader github.com/gofrs/uuid.UUID "[]*github.com/stashapp/stash-box/pkg/models.BodyModification"; \
		go run github.com/vektah/dataloaden TagCategoryLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stash-box/pkg/models.TagCategory";

.PHONY: test
test: 
	go test ./...

# Runs the integration tests. -count=1 is used to ensure results are not
# cached, which is important if the environment changes
.PHONY: it
it:
	go test -tags=integration -count=1 ./...
	
# Runs gofmt -w on the project's source code, modifying any files that do not match its style.
.PHONY: fmt
fmt:
	go fmt ./...

# Runs go vet on the project's source code.
.PHONY: vet
vet:
	go vet ./...

.PHONY: lint
lint:
	revive -config revive.toml -exclude ./vendor/...  ./...

pre-ui:
	cd frontend && yarn install --frozen-lockfile

.PHONY: ui ui-only
ui-only:
	cd frontend && yarn build

ui: ui-only
	packr2

# just repacks the packr files - use when updating migrations and packed files without 
# rebuilding the UI
.PHONY: packr
packr:
	packr2
