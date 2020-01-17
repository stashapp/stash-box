# stash-box

[![Discord](https://img.shields.io/discord/559159668438728723.svg?logo=discord)](https://discord.gg/2TsNFKt)

**stash-box is Stash App's own OpenSource video indexing and Perceptual Hashing MetaData API for porn.**

The intent of stash-box is to provide a collaborative, crowd-sourced database of porn metadata, in the same way as [MusicBrainz](https://musicbrainz.org/) does for music. The submission and editing of metadata is expected to follow the same principle as that of the MusicBrainz database. [See here](https://musicbrainz.org/doc/Editing_FAQ) for how MusicBrainz does it.

Currently, stash-box provides a graphql backend API only. There is no built in UI. The graphql playground can be accessed at `host:port/playground`. The graphql interface is at `host:port/graphql`.

# Docker install

TODO

# Bare-metal Install

Stash-box supports macOS, Windows, and Linux.  

Releases TODO

## CLI

Stash-box provides some command line options.  See what is currently available by running `stashdb --help`.

For example, to run stash locally on port 80 run it like this (OSX / Linux) `stashdb --host 127.0.0.1 --port 80`

## Configuration

Stash-box generates a configuration file in the current working directory when it is first started up. This configuration file is generated with the following defaults:
- running on `0.0.0.0` port `9998`
- sqlite3 database generated in the current working directory named `stashdb-go.sqlite`
- generated read (`read_api_key`) and write (`modify_api_key`) API keys. These can be deleted to disable read/write authentication (all requests will be allowed without API key)

### API keys

These are a very basic authorization method. When set, the `ApiKey` header must be set to the correct value to read/write the data. The write API key allows reading and writing. The read API key allows only reading.

### Postgres Support

Stash-box can be configured to run with a Postgres database. To use a Postgres database, the config file have the following fields:
```
database_type: postgres
database: <user>:<password>@<host>/<dbname>?[sslmode=<sslmode>]
```

The database `<dbname>` must be created already. The schema will be created within the database if it is not already present.

The `sslmode` parameter is documented in the [pq documentation](https://godoc.org/github.com/lib/pq). Use `sslmode=disable` to not use SSL for the database connection. The default value is `require`.

## SSL (HTTPS)

Stash-box supports HTTPS with some additional work.  First you must generate a SSL certificate and key combo.  Here is an example using openssl:

`openssl req -x509 -newkey rsa:4096 -sha256 -days 7300 -nodes -keyout stashdb.key -out stashdb.crt -extensions san -config <(echo "[req]"; echo distinguished_name=req; echo "[san]"; echo subjectAltName=DNS:stashdb.server,IP:127.0.0.1) -subj /CN=stashdb.server`

This command would need customizing for your environment.  [This link](https://stackoverflow.com/questions/10175812/how-to-create-a-self-signed-certificate-with-openssl) might be useful.

Once you have a certificate and key file name them `stashdb.crt` and `stashdb.key` and place them in the directory where stash-box is run from. Stash-box detects these and starts up using HTTPS rather than HTTP.

# FAQ

> I have a question not answered here.

Join the [Discord server](https://discord.gg/2TsNFKt).

# Development

## Install

* [Revive](https://github.com/mgechev/revive) - Configurable linter
    * Go Install: `go get github.com/mgechev/revive`
* [Packr2](https://github.com/gobuffalo/packr/tree/v2.0.2/v2) - Static asset bundler
    * Go Install: `go get github.com/gobuffalo/packr/v2/packr2@v2.0.2`
    * [Binary Download](https://github.com/gobuffalo/packr/releases)
* [Yarn](https://yarnpkg.com/en/docs/install) - Yarn package manager

NOTE: You may need to run the `go get` commands outside the project directory to avoid modifying the projects module file.

## Environment

### macOS

TODO

### Windows

1. Download and install [Go for Windows](https://golang.org/dl/)
2. Download and install [MingW](https://sourceforge.net/projects/mingw-w64/)
3. Search for "advanced system settings" and open the system properties dialog.
    1. Click the `Environment Variables` button
    2. Add `GO111MODULE=on`
    3. Under system variables find the `Path`.  Edit and add `C:\Program Files\mingw-w64\*\mingw64\bin` (replace * with the correct path).

## Commands

* `make generate` - Generate Go GraphQL and packr2 files. This should be run if the graphql schema or schema migration files have changed.
* `make build` - Builds the binary
* `make vet` - Run `go vet`
* `make lint` - Run the linter
* `make test` - Runs the unit tests
* `make it` - Runs the unit and integration tests

**Note:** the integration tests run against a temporary sqlite3 database by default. They can be run against a postgres server by setting the environment variable `POSTGRES_DB` to the postgres connection string. For example: `postgres@localhost/stash-box-test?sslmode=disable`. **Be aware that the integration tests drop all tables before and after the tests.**

## Building a release

1. Run `make generate` to create generated files 
2. Run `make build` to build the executable for your current platform

## Cross compiling

TODO
