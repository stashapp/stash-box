LDFLAGS := $(LDFLAGS)
ifdef OUTPUT
  OUTPUT := -o $(OUTPUT)
endif

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
	go build $(OUTPUT) -v -ldflags "-X 'github.com/stashapp/stash-box/pkg/api.version=$(STASH_BOX_VERSION)' -X 'github.com/stashapp/stash-box/pkg/api.buildstamp=$(BUILD_DATE)' -X 'github.com/stashapp/stash-box/pkg/api.githash=$(GITHASH)'"

# Regenerates GraphQL files
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

# Runs all configured linuters. golangci-lint needs to be installed locally first.
.PHONY: lint
lint:
	golangci-lint run

pre-ui:
	cd frontend && yarn install --frozen-lockfile

.PHONY: ui
ui:
	cd frontend && yarn build

# runs tests and checks on the UI and builds it
.PHONY: ui-validate
ui-validate:
	cd frontend && yarn run validate

.PHONY: cross-compile
cross-compile:
ifdef CI
	$(eval CI_ARGS := -v $(PWD)/.go-cache:/root/.cache/go-build)
endif
	docker run --rm --privileged $(CI_ARGS) \
				-v $(PWD):/go/src/github.com/stashapp/stash-box \
				-v /var/run/docker.sock:/var/run/docker.sock \
				-w /go/src/github.com/stashapp/stash-box \
				ghcr.io/gythialy/golang-cross:latest --snapshot --rm-dist
