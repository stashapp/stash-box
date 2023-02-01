# stash-box

[![Discord](https://img.shields.io/discord/559159668438728723.svg?logo=discord)](https://discord.gg/2TsNFKt)

Stash-box is an open-source video indexing and metadata API server for porn developed by Stash App. The purpose of stash-box is to provide a community-driven database of porn metadata, similar to what MusicBrainz does for music. The submission and editing of metadata should follow the same principles as MusicBrainz. [Learn more here](https://musicbrainz.org/doc/Editing_FAQ). Installing Stash-box will create an empty database for you to populate.

You can access the GraphQL playground at `host:port/playground`, and the GraphQL interface can be found at `host:port/graphql`.

**Note**: If you're a Stash user, you don't need to install stash-box. The Stash community has a server with many titles from which you can pull data. You can get the login information from the [#stashdb-invites](https://discord.com/channels/559159668438728723/935614155107471442) channel on our [Discord server](https://discord.gg/2TsNFKt).

# Docker install

You can find a `docker-compose` file for production deployment [here](docker/production/docker-compose.yml). You can omit Traefik if you don't need a reverse proxy.

If you already have PostgreSQL installed, you can install stash-box on its own from [Docker Hub](https://hub.docker.com/r/stashapp/stash-box).

# Bare-Metal Install

Stash-box supports macOS, Windows, and Linux. Releases are coming soon.

## Initial setup

1. Run `make` to build the application.
2. Stash-box requires access to a PostgreSQL database server. Suppose stash-box doesn't find a configuration file (defaults to `stash-box-config.yml` in the current directory). In that case, it will generate a default configuration file with a default PostgreSQL connection string (`postgres@localhost/stash-box?sslmode=disable`). You can adjust the connection string as needed.
3. The database must be created and available. If the PostgreSQL user is not a superuser, run `CREATE EXTENSION pg_trgm; CREATE EXTENSION pgcrypto;` by a superuser before rerunning Stash-box. If the schema is not present, it will be created within the database.
4. The `sslmode` parameter is documented [here](https://godoc.org/github.com/lib/pq). Use `sslmode=disable` to not use SSL for the database connection. The default is `require`.
5. After ensuring the database connection and availability, rerun Stash-box.
#### Schema migrations and initial Admin user.
The second time that stash-box is run, stash-box will run the schema migrations to create the required tables. It will also generate a `root` user with a random password and an API key. These credentials are printed once to stdout and are not logged. The system will regenerate the root user on startup if it does not exist. You can force the system to create a new root user by deleting the root user row from the database and restarting Stash-box. You'll need to capture the console output with your Admin user on the first successful StashDB executable start. Otherwise, you will need to allow Postgres to re-create the database before it will re-post a new `root` user.

# Stash-box CLI and Configuration

Stash-box is a tool with command line options to make it easier. To see what options are available, run `stash-box --help` in your terminal.

Here's an example of how you can run stash-box locally on port 80:

`stash-box --host 127.0.0.1 --port 80`


**Note:** This command should work on OSX / Linux.

When you start stash-box for the first time, it generates a configuration file called `stash-box-config.yml` in your current working directory. This file contains default settings for stash-box, including:

- Host: `0.0.0.0`
- Port: `9998`

You can change these defaults if needed. For example, if you want to disable the Graphql playground and cross-domain cookies, you can set `is_production` to `true`.

## API Keys and Authorization

There are two ways to authenticate a user in Stash-box: a session or an API key.

1. Session-based authentication: To log in, send a request to `/login` with the `username` and `password` in plain text as form values. Session-based authentication will set a cookie that is required for all subsequent requests. To log out, send a request to `/logout`.

2. API key authentication: To use an API key, set the `ApiKey` header to the user's API key value.

## SSL (HTTPS)

Stash-box is runnable, preferably over HTTPS, for added security, but it requires some setup. You'll need to generate an SSL certificate and key pair to set this up. Or use a TLS terminating proxy of your choice, such as Traefik, Nginx (unsupported), or Caddy Server (unsupported)

Here's an example of how you can do this using OpenSSL:

`openssl req -x509 -newkey rsa:4096 -sha256 -days 7300 -nodes -keyout stash-box.key -out stash-box.crt -extensions san -config <(echo "[req]"; echo distinguished_name=req; echo "[san]"; echo subjectAltName=DNS:stash-box.server,IP:127.0.0.1) -subj /CN=stash-box.server`


You might need to modify the command for your specific setup. You can find more information about creating a self-signed certificate with OpenSSL [here](https://stackoverflow.com/questions/10175812/how-to-create-a-self-signed-certificate-with-openssl).

Once you've generated the certificate and key pair, make sure they're named `stash-box.crt` and `stash-box.key` respectively, and place them in the same directory as stash-box. When Stash-box detects these files, it will use HTTPS instead of HTTP.

## PHash Distance Matching

If you want to enable distance matching for phashes in stash-box, you'll need to install the [pg-spgist_hamming](https://github.com/fake-name/pg-spgist_hamming) Postgres extension.

The recommended way to do this is to use the [docker image](docker/production/postgres/Dockerfile). Still, you can also install it manually by following the build instructions in the pg-spgist_hamming repository.

Suppose you install the extension after you've run the migrations. In that case, you'll need to run migration #14 manually to install the extension and add the index. If you don't want to do this, you can wipe the database, and the migrations will run the next time you start stash-box.

# Development

## Install

* [Go](https://golang.org/dl/), minimum version 1.17.
* [golangci-lint](https://golangci-lint.run/) - Linter aggregator
    * Follow instructions for your platform from [https://golangci-lint.run/usage/install/](https://golangci-lint.run/usage/install/).
    * Run the linters with `make lint`.
* [Yarn](https://yarnpkg.com/en/docs/install) - Yarn package manager

## Commands

* `make generate` - Generate Go GraphQL files. This command should be run if the Graphql schema has changed.
* `make ui` - Builds the UI.
* `make pre-ui` - Download frontend dependencies
* `make build` - Builds the binary
* `make test` - Runs the unit tests
* `make it` - Runs the unit and integration tests
* `make lint` - Run the linter
* `make fmt` - Formats and aligns whitespace

**Note:** the integration tests run against a temporary sqlite3 database by default. They can be run against a Postgres server by setting the environment variable `POSTGRES_DB` to the Postgres connection string. For example: `postgres@localhost/stash-box-test?sslmode=disable`. **Be aware that the integration tests drop all tables before and after the tests.**

## Frontend development

To run the frontend in development mode, run `yarn start` from the frontend directory.

When developing, the API key can be set in `frontend/.env.development.local` to avoid having to log in.  
When `is_production` is enabled on the server, this is the only way to authorize in the frontend development environment. If the server uses https or runs on a custom port, this also needs to be configured in `.env.development.local`.  
See `frontend/.env.development.local.shadow` for examples.

## Building a release

1. Run `make generate` to create generated files if they have been changed.
2. Run `make ui build` to build the executable for your current platform.

# FAQ

> I have a question that needs to be answered here.

Join the [Discord server](https://discord.gg/2TsNFKt).
