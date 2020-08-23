ifeq ($(OS),Windows_NT)
  SEPARATOR := &&
  SET := set
  EXT := .exe
endif

.PHONY: build pre-build

pre-build:
ifndef BUILD_DATE
	$(eval BUILD_DATE := $(shell go run -mod=vendor scripts/getDate.go))
endif

ifndef GITHASH
	$(eval GITHASH := $(shell git rev-parse --short HEAD))
endif

OUTPUT := stashdb$(EXT)

build: pre-build
	$(SET) CGO_ENABLED=1 $(SEPARATOR) $(SET) GO111MODULE=on $(SEPARATOR) $(BUILDENV) go build -v \
	-ldflags "-X 'github.com/stashapp/stashdb/pkg/api.buildstamp=$(BUILD_DATE)' -X 'github.com/stashapp/stashdb/pkg/api.githash=$(GITHASH)' -s -w $(LDFLAGS)" \
	-o $(OUTPUT)

install:
	packr2 install

clean:
	packr2 clean

# Regenerates GraphQL files and packr files
.PHONY: generate
generate:
	go generate

.PHONY: generate-dataloaders
generate-dataloaders:
	cd pkg/dataloader; \
		go run github.com/vektah/dataloaden UUIDsLoader github.com/gofrs/uuid.UUID "[]github.com/gofrs/uuid.UUID"; \
		go run github.com/vektah/dataloaden URLLoader github.com/gofrs/uuid.UUID "[]*github.com/stashapp/stashdb/pkg/models.URL"; \
		go run github.com/vektah/dataloaden TagLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stashdb/pkg/models.Tag"; \
		go run github.com/vektah/dataloaden StringsLoader github.com/gofrs/uuid.UUID "[]string"; \
		go run github.com/vektah/dataloaden SceneAppearancesLoader github.com/gofrs/uuid.UUID "github.com/stashapp/stashdb/pkg/models.PerformersScenes"; \
		go run github.com/vektah/dataloaden PerformerLoader  github.com/gofrs/uuid.UUID "*github.com/stashapp/stashdb/pkg/models.Performer"; \
		go run github.com/vektah/dataloaden ImageLoader github.com/gofrs/uuid.UUID "*github.com/stashapp/stashdb/pkg/models.Image"; \
		go run github.com/vektah/dataloaden FingerprintsLoader github.com/gofrs/uuid.UUID "[]*github.com/stashapp/stashdb/pkg/models.Fingerprint"; \
		go run github.com/vektah/dataloaden BodyModificationsLoader github.com/gofrs/uuid.UUID "[]*github.com/stashapp/stashdb/pkg/models.BodyModification";

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

packr:
	$(SET) GO111MODULE=on $(SEPARATOR) packr2

# cross compilation targets - use in docker compiler image
.PHONY: build-win build-osx build-linux cross-compile-docker
build-win: BUILDENV := GOOS=windows GOARCH=amd64 CC=x86_64-w64-mingw32-gcc CXX=x86_64-w64-mingw32-g++
build-win: LDFLAGS := -extldflags '-static'
build-win: OUTPUT := dist/$(OUTPUT)-win.exe

build-osx: BUILDENV := GOOS=darwin GOARCH=amd64 CC=o64-clang CXX=o64-clang++
build-osx: OUTPUT := dist/$(OUTPUT)-osx

build-linux: OUTPUT := dist/$(OUTPUT)-linux

build-win build-osx build-linux: build

cross-compile-docker-packr:
	docker run --rm --mount type=bind,source="$(shell pwd)",target=/stashdb -w /stashdb stashapp/box-compiler:1 /bin/bash -c "make packr && make build-win && make build-osx && make build-linux" 

cross-compile-docker:
	docker run --rm --mount type=bind,source="$(shell pwd)",target=/stashdb -w /stashdb stashapp/box-compiler:1 /bin/bash -c "make build-win && make build-osx && make build-linux" 
