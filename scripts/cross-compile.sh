#!/bin/sh

BUILD_DATE=`go run -mod=vendor scripts/getDate.go`
GITHASH=`git rev-parse --short HEAD`
STASH_BOX_VERSION=`git describe --tags --exclude latest_develop`
SETENV="BUILD_DATE=\"$BUILD_DATE\" GITHASH=$GITHASH STASH_BOX_VERSION=\"$STASH_BOX_VERSION\""
SETUP="export GO111MODULE=on; export CGO_ENABLED=1; set -e; echo '=== Running packr ==='; make packr;"
WINDOWS="echo '=== Building Windows binary ==='; $SETENV GOOS=windows GOARCH=amd64 CC=x86_64-w64-mingw32-gcc CXX=x86_64-w64-mingw32-g++ LDFLAGS=\"-extldflags '-static' \" OUTPUT=\"dist/stash-box-win.exe\" make build-release;"
DARWIN="echo '=== Building OSX binary ==='; $SETENV GOOS=darwin GOARCH=amd64 CC=o64-clang CXX=o64-clang++ OUTPUT=\"dist/stash-box-osx\" make build-release;"
LINUX_AMD64="echo '=== Building Linux (amd64) binary ==='; $SETENV GOOS=linux GOARCH=amd64 OUTPUT=\"dist/stash-box-linux\" make build-release-static;"

COMMAND="$SETUP $WINDOWS $DARWIN $LINUX_AMD64 echo '=== Build complete ==='"

docker run --rm --mount type=bind,source="$(pwd)",target=/stash-box -w /stash-box stashapp/box-compiler:1 /bin/bash -c "$COMMAND"
