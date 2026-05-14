import type { APIRequestContext } from "@playwright/test";
import { request } from "@playwright/test";

import { TEST_PASSWORD } from "../fixtures";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:9997";

// No API-key cache: account.spec.ts regenerates e2e_read's key, and a cached
// value would 401 on subsequent uses. The per-call login is ~50ms, which is
// cheap enough to not warrant a cache + invalidation dance.
async function fetchApiKey(username: string, password: string): Promise<string> {
  const sessionCtx = await request.newContext({ baseURL: BASE_URL });
  const loginRes = await sessionCtx.post("/login", {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: new URLSearchParams({ username, password }).toString(),
  });
  if (!loginRes.ok()) {
    throw new Error(
      `login failed for ${username}: ${loginRes.status()} ${await loginRes.text()}`,
    );
  }
  const meRes = await sessionCtx.post("/graphql", {
    data: { query: "query { me { api_key } }" },
    headers: { "content-type": "application/json" },
  });
  const body = (await meRes.json()) as {
    data?: { me?: { api_key?: string } };
  };
  await sessionCtx.dispose();
  const key = body.data?.me?.api_key;
  if (!key) throw new Error(`failed to fetch api_key for ${username}`);
  return key;
}

/**
 * Returns a Playwright APIRequestContext that authenticates as the given
 * seeded user via the ApiKey header. We use the header rather than session
 * cookies because the latter does not round-trip reliably through
 * Playwright's APIRequestContext + the gorilla/sessions cookie store for the
 * server's directive-layer auth.
 */
export async function graphqlAs(username: string): Promise<APIRequestContext> {
  const key = await fetchApiKey(username, TEST_PASSWORD);
  return request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { ApiKey: key },
  });
}

export async function gql<T = unknown>(
  api: APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await api.post("/graphql", {
    data: { query, variables },
    headers: { "content-type": "application/json" },
  });
  if (!res.ok()) {
    throw new Error(`graphql ${res.status()}: ${await res.text()}`);
  }
  const body = (await res.json()) as { data?: T; errors?: unknown };
  if (body.errors) {
    throw new Error(`graphql errors: ${JSON.stringify(body.errors)}`);
  }
  if (!body.data) throw new Error("graphql response missing data");
  return body.data;
}
