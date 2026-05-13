// GraphQL helpers for seeding test data as the bootstrap admin. Use these
// when the prerequisite isn't the thing under test — e.g. a scene-edit test
// shouldn't have to create its parent studio through the UI.
//
// All helpers go through the same mutations the frontend uses, so they exercise
// the real auth + validation paths. Direct *Create mutations (gated by MODIFY,
// which admin implies) are used for fast setup; edit-lifecycle mutations like
// studioEdit are exposed for tests that need a *pending* edit.

import type { APIRequestContext } from "@playwright/test";
import { request } from "@playwright/test";

import { TEST_PASSWORD } from "../fixtures";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:9997";

const BOOTSTRAP_USERNAME =
  process.env.STASH_BOX_BOOTSTRAP_ADMIN_USERNAME ?? "e2e_bootstrap";
const BOOTSTRAP_PASSWORD =
  process.env.STASH_BOX_BOOTSTRAP_ADMIN_PASSWORD ?? TEST_PASSWORD;

let bootstrapKey: string | undefined;

/**
 * Open an APIRequestContext authenticated as the bootstrap admin via ApiKey
 * header. See helpers/graphql.ts:fetchApiKey for the rationale.
 */
export async function adminApi(): Promise<APIRequestContext> {
  if (!bootstrapKey) {
    const sessionCtx = await request.newContext({ baseURL: BASE_URL });
    const loginRes = await sessionCtx.post("/login", {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: new URLSearchParams({
        username: BOOTSTRAP_USERNAME,
        password: BOOTSTRAP_PASSWORD,
      }).toString(),
    });
    if (!loginRes.ok()) {
      throw new Error(
        `admin login failed: ${loginRes.status()} ${await loginRes.text()}`,
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
    bootstrapKey = body.data?.me?.api_key;
    if (!bootstrapKey)
      throw new Error("failed to fetch bootstrap admin api_key");
  }
  return request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { ApiKey: bootstrapKey },
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
  const body = (await res.json()) as { data?: T; errors?: unknown[] };
  if (body.errors?.length) {
    throw new Error(`graphql errors: ${JSON.stringify(body.errors)}`);
  }
  if (!body.data) throw new Error("graphql response missing data");
  return body.data;
}

/** Unique-ish suffix so parallel workers don't collide. */
export const uniq = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// ---------------------------------------------------------------------------
// Direct-create helpers (admin only; bypass the edit lifecycle)
// ---------------------------------------------------------------------------

export async function createTagCategory(
  api: APIRequestContext,
  name = uniq("cat"),
): Promise<{ id: string; name: string }> {
  const data = await gql<{ tagCategoryCreate: { id: string; name: string } }>(
    api,
    `mutation($input: TagCategoryCreateInput!) {
       tagCategoryCreate(input: $input) { id name }
     }`,
    { input: { name, group: "SCENE" } },
  );
  return data.tagCategoryCreate;
}

export async function createTag(
  api: APIRequestContext,
  opts: { name?: string; categoryId?: string } = {},
): Promise<{ id: string; name: string }> {
  const data = await gql<{ tagCreate: { id: string; name: string } }>(
    api,
    `mutation($input: TagCreateInput!) {
       tagCreate(input: $input) { id name }
     }`,
    {
      input: {
        name: opts.name ?? uniq("tag"),
        category_id: opts.categoryId,
      },
    },
  );
  return data.tagCreate;
}

export async function createStudio(
  api: APIRequestContext,
  opts: { name?: string } = {},
): Promise<{ id: string; name: string }> {
  const data = await gql<{ studioCreate: { id: string; name: string } }>(
    api,
    `mutation($input: StudioCreateInput!) {
       studioCreate(input: $input) { id name }
     }`,
    { input: { name: opts.name ?? uniq("studio") } },
  );
  return data.studioCreate;
}

export async function createPerformer(
  api: APIRequestContext,
  opts: { name?: string } = {},
): Promise<{ id: string; name: string }> {
  const data = await gql<{ performerCreate: { id: string; name: string } }>(
    api,
    `mutation($input: PerformerCreateInput!) {
       performerCreate(input: $input) { id name }
     }`,
    {
      input: {
        name: opts.name ?? uniq("performer"),
        gender: "FEMALE",
      },
    },
  );
  return data.performerCreate;
}

export async function createSite(
  api: APIRequestContext,
  opts: { name?: string; url?: string } = {},
): Promise<{ id: string; name: string }> {
  const data = await gql<{ siteCreate: { id: string; name: string } }>(
    api,
    `mutation($input: SiteCreateInput!) {
       siteCreate(input: $input) { id name }
     }`,
    {
      input: {
        name: opts.name ?? uniq("site"),
        url: opts.url ?? "https://example.com",
        valid_types: ["SCENE"],
      },
    },
  );
  return data.siteCreate;
}

// ---------------------------------------------------------------------------
// Edit-lifecycle helpers (use when the test cares about the pending edit)
// ---------------------------------------------------------------------------

/**
 * Submit a CREATE-type studio edit as the given API context (any EDIT user).
 * Leaves the edit in PENDING state — caller is responsible for approving or
 * voting on it.
 */
export async function submitStudioCreateEdit(
  api: APIRequestContext,
  name = uniq("studio"),
): Promise<{ id: string }> {
  const data = await gql<{ studioEdit: { id: string } }>(
    api,
    `mutation($input: StudioEditInput!) {
       studioEdit(input: $input) { id }
     }`,
    {
      input: {
        edit: { operation: "CREATE" },
        details: { name },
      },
    },
  );
  return data.studioEdit;
}

export async function submitTagCreateEdit(
  api: APIRequestContext,
  opts: { name?: string; categoryId?: string } = {},
): Promise<{ id: string }> {
  const data = await gql<{ tagEdit: { id: string } }>(
    api,
    `mutation($input: TagEditInput!) {
       tagEdit(input: $input) { id }
     }`,
    {
      input: {
        edit: { operation: "CREATE" },
        details: {
          name: opts.name ?? uniq("tag"),
          category_id: opts.categoryId,
        },
      },
    },
  );
  return data.tagEdit;
}

export async function castVote(
  api: APIRequestContext,
  editId: string,
  vote: "ACCEPT" | "REJECT" | "ABSTAIN",
) {
  await gql(
    api,
    `mutation($input: EditVoteInput!) {
       editVote(input: $input) { id status }
     }`,
    { input: { id: editId, vote } },
  );
}

export async function fetchEditStatus(
  api: APIRequestContext,
  editId: string,
): Promise<string> {
  const data = await gql<{ findEdit: { status: string } | null }>(
    api,
    `query($id: ID!) {
       findEdit(id: $id) { status }
     }`,
    { id: editId },
  );
  if (!data.findEdit) throw new Error(`edit ${editId} not found`);
  return data.findEdit.status;
}
