import { type FullConfig, request, type APIRequestContext } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { ROLES, TEST_PASSWORD, authStateFile } from "./fixtures";

// .auth/ lives at the e2e/ root — see fixtures.ts:authStateFile.
const authDir = path.resolve(__dirname, "..", ".auth");

// Must match the env vars passed to the stash-box binary in playwright.config.ts.
const BOOTSTRAP_USERNAME =
  process.env.STASH_BOX_BOOTSTRAP_ADMIN_USERNAME ?? "e2e_bootstrap";
const BOOTSTRAP_PASSWORD =
  process.env.STASH_BOX_BOOTSTRAP_ADMIN_PASSWORD ?? TEST_PASSWORD;

async function login(
  baseURL: string,
  username: string,
  password: string,
): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL });
  const form = new URLSearchParams({ username, password });
  const res = await ctx.post("/login", {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: form.toString(),
  });
  if (!res.ok()) {
    throw new Error(
      `login failed for ${username}: ${res.status()} ${await res.text()}`,
    );
  }
  return ctx;
}

/**
 * The session cookie that `/login` sets doesn't reliably carry the user's
 * ADMIN role through Playwright's APIRequestContext for subsequent `/graphql`
 * calls (cookies are stored but the directive layer rejects the request). API
 * keys go through a different auth path that works, so we fetch the admin's
 * key once and reuse it. Browser tests still use the cookie via storageState
 * because those go through the actual browser cookie jar, which is fine.
 */
async function apiKeyFor(
  baseURL: string,
  username: string,
  password: string,
): Promise<string> {
  const sessionCtx = await login(baseURL, username, password);
  const res = await sessionCtx.post("/graphql", {
    data: { query: "query { me { api_key } }" },
    headers: { "content-type": "application/json" },
  });
  const body = (await res.json()) as {
    data?: { me?: { api_key?: string } };
    errors?: unknown[];
  };
  await sessionCtx.dispose();
  const key = body.data?.me?.api_key;
  if (!key) throw new Error(`failed to fetch api_key for ${username}: ${JSON.stringify(body)}`);
  return key;
}

async function adminApiContext(baseURL: string): Promise<APIRequestContext> {
  const key = await apiKeyFor(baseURL, BOOTSTRAP_USERNAME, BOOTSTRAP_PASSWORD);
  return request.newContext({
    baseURL,
    extraHTTPHeaders: { ApiKey: key },
  });
}

async function gql(
  api: APIRequestContext,
  query: string,
  variables: Record<string, unknown>,
): Promise<unknown> {
  const res = await api.post("/graphql", {
    data: { query, variables },
    headers: { "content-type": "application/json" },
  });
  if (!res.ok()) {
    throw new Error(`graphql ${res.status()}: ${await res.text()}`);
  }
  const body = (await res.json()) as { data?: unknown; errors?: unknown[] };
  if (body.errors?.length) {
    throw new Error(`graphql errors: ${JSON.stringify(body.errors)}`);
  }
  return body.data;
}

const CREATE_USER = /* GraphQL */ `
  mutation Create($input: UserCreateInput!) {
    userCreate(input: $input) { id }
  }
`;

async function ensureUser(
  admin: APIRequestContext,
  username: string,
  roles: string[],
) {
  // findUser surfaces "no rows in result set" as an error rather than
  // returning null, so we can't cleanly distinguish "not found" from a real
  // failure. Just attempt the create and treat unique-constraint errors as
  // "already there".
  try {
    await gql(admin, CREATE_USER, {
      input: {
        name: username,
        password: TEST_PASSWORD,
        email: `${username}@example.com`,
        roles,
      },
    });
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (/exists|duplicate|unique/i.test(msg)) return;
    throw err;
  }
}

const ROLE_GRANTS: Record<string, string[]> = {
  e2e_admin: ["ADMIN"],
  e2e_modify: ["MODIFY"],
  e2e_moderate: ["MODERATE"],
  e2e_edit: ["EDIT"],
  e2e_edit2: ["EDIT"],
  e2e_vote: ["VOTE"],
  e2e_read: ["READ"],
};

export default async function globalSetup(config: FullConfig) {
  if (!existsSync(authDir)) mkdirSync(authDir, { recursive: true });

  const baseURL =
    config.projects[0].use.baseURL ??
    process.env.E2E_BASE_URL ??
    "http://127.0.0.1:9997";

  // The bootstrap admin is created by the stash-box binary on startup from env
  // vars (see cmd/stash-box/main.go:bootstrapAdminFromEnv). Authenticate via
  // ApiKey header for the GraphQL seeding step.
  const admin = await adminApiContext(baseURL);

  for (const role of ROLES) {
    await ensureUser(admin, role.username, ROLE_GRANTS[role.username]);
  }
  await admin.dispose();

  // Now log in as each role and persist the session cookies for tests to reuse.
  for (const role of ROLES) {
    const ctx = await login(baseURL, role.username, TEST_PASSWORD);
    await ctx.storageState({ path: authStateFile(role.username) });
    await ctx.dispose();
    console.log(`[e2e] saved auth state for ${role.username}`);
  }
}
