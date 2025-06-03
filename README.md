# stash-box

[![Build](https://github.com/stashapp/stash-box/actions/workflows/build.yml/badge.svg?branch=master&event=push)](https://github.com/stashapp/stash-box/actions/workflows/build.yml)
[![Open Collective backers](https://img.shields.io/opencollective/backers/stashapp?logo=opencollective)](https://opencollective.com/stashapp)
[![Go Report Card](https://goreportcard.com/badge/github.com/stashapp/stash-box)](https://goreportcard.com/report/github.com/stashapp/stash-box)
[![Discord](https://img.shields.io/discord/559159668438728723.svg?logo=discord)](https://discord.gg/2TsNFKt)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/stashapp/stash-box?logo=github)](https://github.com/stashapp/stash-box/releases/latest)
[![GitHub issues by-label](https://img.shields.io/github/issues-raw/stashapp/stash-box/bounty)](https://github.com/stashapp/stash-box/labels/bounty)

Stash-box is an open-source video indexing and metadata API server for porn developed by Stash App. The purpose of stash-box is to provide a community-driven database of porn metadata, similar to what MusicBrainz does for music. The submission and editing of metadata should follow the same principles as MusicBrainz. [Learn more here](https://musicbrainz.org/doc/Editing_FAQ). Installing Stash-box will create an empty database for you to populate.

# Canonical community-database

If you're a Stash user, you don't need to install stash-box. The Stash community has a server with many titles from which you can pull data. You can get the login information from our guide to [Accessing StashDB](https://guidelines.stashdb.org/docs/faq_getting-started/stashdb/accessing-stashdb/).

# Docker install

You can find a `docker-compose` file for production deployment [here](docker/production/docker-compose.yml). You can omit Traefik if you don't need a reverse proxy.

If you already have PostgreSQL installed, you can install stash-box on its own from [Docker Hub](https://hub.docker.com/r/stashapp/stash-box).

# Bare-metal install

Stash-box supports macOS, Windows, and Linux. Releases for Windows and Linux can be found [here](https://github.com/stashapp/stash-box/releases).

## Prerequisites
To build stash-box on linux [libvips](https://www.libvips.org/) must be installed, as well as gcc.

## Initial setup

1. Run `make` to build the application.
2. Stash-box requires access to a PostgreSQL database server. Suppose stash-box doesn't find a configuration file (defaults to `stash-box-config.yml` in the current directory). In that case, it will generate a default configuration file with a default PostgreSQL connection string (`postgres@localhost/stash-box?sslmode=disable`). You can adjust the connection string as needed.
3. The database must be created and available. If the PostgreSQL user is not a superuser, run `CREATE EXTENSION pg_trgm; CREATE EXTENSION pgcrypto;` by a superuser before rerunning Stash-box. If the schema is not present, it will be created within the database.
4. The `sslmode` parameter is documented [here](https://godoc.org/github.com/lib/pq). Use `sslmode=disable` to not use SSL for the database connection. The default is `require`.
5. After ensuring the database connection and availability, rerun Stash-box.
#### Schema migrations and initial Admin user
The second time that stash-box is run, stash-box will run the schema migrations to create the required tables. It will also generate a `root` user with a random password and an API key. These credentials are printed once to stdout and are not logged. The system will regenerate the root user on startup if it does not exist. You can force the system to create a new root user by deleting the root user row from the database and restarting Stash-box. You'll need to capture the console output with your Admin user on the first successful StashDB executable start. Otherwise, you will need to allow Postgres to re-create the database before it will re-post a new `root` user.

# Stash-box CLI and configuration

Stash-box is a tool with command line options to make it easier. To see what options are available, run `stash-box --help` in your terminal.

Here's an example of how you can run stash-box locally on port 80:

`stash-box --host 127.0.0.1 --port 80`


**Note:** This command should work on OSX / Linux.

When you start stash-box for the first time, it generates a configuration file called `stash-box-config.yml` in your current working directory. This file contains default settings for stash-box, including:

- Host: `0.0.0.0`
- Port: `9998`

You can change these defaults if needed. For example, if you want to disable the GraphQL playground and cross-domain cookies, you can set `is_production` to `true`.

## API keys and authorization

There are two ways to authenticate a user in Stash-box: a session or an API key.

1. Session-based authentication: To log in, send a request to `/login` with the `username` and `password` in plain text as form values. Session-based authentication will set a cookie that is required for all subsequent requests. To log out, send a request to `/logout`.

2. API key authentication: To use an API key, set the `ApiKey` header to the user's API key value.

### Configuration keys

| Key | Default | Description |
|-----|---------|-------------|
| `title` | `Stash-Box` | Title of the instance, used in the page title. |
| `require_invite` | `true` | If true, users are required to enter an invite key, generated by existing users to create a new account. |
| `require_activation` | `false` | If true, users are required to verify their email address before creating an account. Requires `email_from`, `email_host`, and `host_url` to be set. |
| `activation_expiry` | `7200` (2 hours) | The time - in seconds - after which an activation key (emailed to the user for email verification or password reset purposes) expires. |
| `email_cooldown` | `300` (5 minutes) | The time - in seconds - that a user must wait before submitting an activation or reset password request for a specific email address. |
| `default_user_roles` | `READ`, `VOTE`, `EDIT` | The roles assigned to new users when registering. This field must be expressed as a yaml array. |
| `guidelines_url` | (none) | URL to link to a set of guidelines for users contributing edits. Should be in the form of `https://hostname.com`. |
| `vote_promotion_threshold` | (none) | Number of approved edits before a user automatically has the `VOTE` role assigned. Leave empty to disable. |
| `vote_application_threshold` | `3` | Number of same votes required for immediate application of an edit. Set to zero to disable automatic application. |
| `voting_period` | `345600` | Time, in seconds, before a voting period is closed. |
| `min_destructive_voting_period` | `172800` | Minimum time, in seconds, that needs to pass before a destructive edit can be immediately applied with sufficient positive votes. |
| `vote_cron_interval` | `5m` | Time between runs to close edits whose voting periods have ended. |
| `edit_update_limit` | `1` | Number of times an edit can be updated by the creator. |
| `email_host` | (none) | Address of the SMTP server. Required to send emails for activation and recovery purposes. |
| `email_port` | `25` | Port of the SMTP server. Only STARTTLS is supported. Direct TLS connections are not supported. |
| `email_user` | (none) | Username for the SMTP server. Optional. |
| `email_password` | (none) | Password for the SMTP server. Optional. |
| `email_from` | (none) | Email address from which to send emails. |
| `host_url` | (none) | Base URL for the server. Used when sending emails. Should be in the form of `https://hostname.com`. |
| `image_location` | (none) | Path to store images, for local image storage. An error will be displayed if this is not set when creating non-URL images. |
| `image_backend` | (`file`) | Storage solution for images. Can be set to either `file` or `s3`. |
| `image_jpeg_quality` | `75` | Quality setting when resizing JPEG images. Valid values are 0-100. |
| `image_max_size` | (none) | Max size of image, if no size is specified. Omit to return full size. |
| `image_resizing.enabled` | false | Whether to resize images shown in the frontend. |
| `image_resizing.cache_path` | (none) | Folder in which resized images will be saved for later requests. Recommended when resizing is enabled. |
| `image_resizing.min_size` | (none) | Only resize images above a certain size |
| `userLogFile` | (none) | Path to the user log file, which logs user operations. If not set, then these will be output to stderr. |
| `s3.endpoint` | (none) | Hostname to s3 endpoint used for image storage. |
| `s3.bucket` | (none) | Name of S3 bucket used to store images. |
| `s3.access_key` | (none) | Access key used for authentication. |
| `s3.secret ` | (none) | Secret Access key used for authentication. |
| `s3.max_dimension` | (none) | If set, a resized copy will be created for any image whose dimensions exceed this number. This copy will be served in place of the original. |
| `s3.upload_headers` | (none) | A map of headers to send with each upload request. For example, DigitalOcean requires the `x-amz-acl` header to be set to `public-read` or it does not make the uploaded images available. |
| `phash_distance` | 0 | Determines what binary distance is considered a match when querying with a pHash fingeprint. Using more than 8 is not recommended and may lead to large amounts of false positives. **Note**: The [pg-spgist_hamming extension](#phash-distance-matching) must be installed to use distance matching, otherwise you will get errors. |
| `favicon_path` | (none) | Location where favicons for linked sites should be stored. Leave empty to disable. |
| `draft_time_limit` | (24h) | Time, in seconds, before a draft is deleted. |
| `profiler_port` | 0 | Port on which to serve pprof output. Omit to disable entirely. |
| `postgres.max_open_conns` | (0) | Maximum number of concurrent open connections to the database. |
| `postgres.max_idle_conns` | (0) | Maximum number of concurrent idle database connections. |
| `postgres.conn_max_lifetime` | (0) | Maximum lifetime in minutes before a connection is released. |
| `require_scene_draft` | false | Whether to allow scene creation outside of draft submissions. |
| `require_tag_role` | false | Whether to require the EditTag role to edit tags. |

## SSL (HTTPS)

Stash-box is runnable, preferably over HTTPS, for added security, but it requires some setup. You'll need to generate an SSL certificate and key pair to set this up. Or use a TLS terminating proxy of your choice, such as Traefik, Nginx (unsupported), or Caddy Server (unsupported)

Here's an example of how you can do this using OpenSSL:

`openssl req -x509 -newkey rsa:4096 -sha256 -days 7300 -nodes -keyout stash-box.key -out stash-box.crt -extensions san -config <(echo "[req]"; echo distinguished_name=req; echo "[san]"; echo subjectAltName=DNS:stash-box.server,IP:127.0.0.1) -subj /CN=stash-box.server`


You might need to modify the command for your specific setup. You can find more information about creating a self-signed certificate with OpenSSL [here](https://stackoverflow.com/questions/10175812/how-to-create-a-self-signed-certificate-with-openssl).

Once you've generated the certificate and key pair, make sure they're named `stash-box.crt` and `stash-box.key` respectively, and place them in the same directory as stash-box. When Stash-box detects these files, it will use HTTPS instead of HTTP.

## pHash Distance Matching

If you want to enable distance matching for pHashes in stash-box, you'll need to install the [pg-spgist_hamming](https://github.com/fake-name/pg-spgist_hamming) Postgres extension.

The recommended way to do this is to use the [docker image](docker/production/postgres/Dockerfile). Still, you can also install it manually by following the build instructions in the pg-spgist_hamming repository.

Suppose you install the extension after you've run the migrations. In that case, you'll need to run migration #14 manually to install the extension and add the index. If you don't want to do this, you can wipe the database, and the migrations will run the next time you start stash-box.

# Join Our Community

We are excited to announce that we have a new home for support, feature requests, and discussions related to Stash and its associated projects. Join our community on the [Discourse forum](https://discourse.stashapp.cc) to connect with other users, share your ideas, and get help from fellow enthusiasts.

# Development

## Install

* [Go](https://golang.org/dl/), minimum version 1.22.
* [golangci-lint](https://golangci-lint.run/) - Linter aggregator
    * Follow instructions for your platform from [https://golangci-lint.run/usage/install/](https://golangci-lint.run/usage/install/).
    * Run the linters with `make lint`.
* [PNPM](https://pnpm.io/installation) - PNPM package manager

## Commands

* `make generate` - Generate Go GraphQL files. This command should be run if the GraphQL schema has changed.
* `make ui` - Builds the UI.
* `make pre-ui` - Download frontend dependencies
* `make build` - Builds the binary
* `make test` - Runs the unit tests
* `make it` - Runs the unit and integration tests
* `make lint` - Run the linter
* `make fmt` - Formats and aligns whitespace

**Note:** the integration tests run against a temporary sqlite3 database by default. They can be run against a Postgres server by setting the environment variable `POSTGRES_DB` to the Postgres connection string. For example: `postgres@localhost/stash-box-test?sslmode=disable`. **Be aware that the integration tests drop all tables before and after the tests.**

## Frontend development

To run the frontend in development mode, run `pnpm start` from the frontend directory.

When developing, the API key can be set in `frontend/.env.development.local` to avoid having to log in.  
When `is_production` is enabled on the server, this is the only way to authorize in the frontend development environment. If the server uses https or runs on a custom port, this also needs to be configured in `.env.development.local`.  
See `frontend/.env.development.local.shadow` for examples.

## GraphQL playground

You can access the GraphQL playground at `host:port/playground`, and the GraphQL interface can be found at `host:port/graphql`. To execute queries add a header with your API key: `{"APIKey":"<API_KEY>"}`. The API key can be found on your user page in stash-box.

## Building a release

1. Run `make generate` to create generated files if they have been changed.
2. Run `make ui build` to build the executable for your current platform.

# FAQ

> I have a question that needs to be answered here.
* Join the [Discourse forum](https://discourse.stashapp.cc)
* Join the [Discord server](https://discord.gg/2TsNFKt), where the community can offer support.
* Start a [discussion on GitHub](https://github.com/stashapp/stash-box/discussions)

