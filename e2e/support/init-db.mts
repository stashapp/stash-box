// Drops and recreates the e2e Postgres database so stash-box starts from a
// pristine schema on the next launch. Invoked via `pnpm run db:init`.
//
// Reads STASH_BOX_DATABASE if set; otherwise falls back to the same default
// used by playwright.config.ts → e2e/config/stash-box-e2e.yml.

import { Client } from "pg";

const DEFAULT_URL = "postgres:postgres@localhost/stash-box-e2e?sslmode=disable";
const url = process.env.STASH_BOX_DATABASE ?? DEFAULT_URL;

const match = url.match(/^([^:]+):([^@]*)@([^/]+)\/([^?]+)(\?.*)?$/);
if (!match) {
  console.error(`init-db: cannot parse STASH_BOX_DATABASE: ${url}`);
  process.exit(1);
}
const [, user, password, host, dbName, queryString = ""] = match;

const maintenanceUrl = `postgres://${user}:${password}@${host}/postgres${queryString}`;

const client = new Client({ connectionString: maintenanceUrl });
await client.connect();
try {
  // Terminate other sessions so DROP doesn't fail with "database is being accessed by other users".
  await client.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
     WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [dbName],
  );
  await client.query(`DROP DATABASE IF EXISTS "${dbName.replace(/"/g, '""')}"`);
  await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
} finally {
  await client.end();
}
console.log(`init-db: recreated ${dbName}`);
