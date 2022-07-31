# Stash-box frontend

This project builds the frontend for the stash-box server. It can be used to build the static bundle for the go server, or be run standalone for development purposes.

## Setup / Installing
Make sure your environment is up to date:
- node >= `14.16.0`, < `17.0.0`
- yarn >= `1.15.2`

For installation instructions, please see the websites for [yarn](https://yarnpkg.com/lang/en/docs/install/) and [node.js](https://nodejs.org/en/download/).

Install dependencies

```shell
yarn
```

## GraphQL development
If any queries/mutations or the schema on the server is updated, the Typescript types can be updated with:
```shell
yarn generate
```

## Running

### Local development server

The API key can be set in the environment configuration. To do so, you will need to initialize the environment configuration:

```shell
cp .env.development.local.shadow .env.development.local
```

Fill in the `VITE_APIKEY` variable in `.env.development.local` with the API key for the user.

Run the local development server:

```shell
yarn start
```

The server will by default start on [http://localhost:3001](http://localhost:3001) and will automatically be updated whenever any changes are made. The port can be changed by uncommenting the `PORT` entry and setting the value in the `.env.development.local` file.

Run the linter:

```shell
yarn lint
```

Run the code formatter:

```shell
yarn format
```

Build the release bundle:

```shell
yarn build
```
