// Tier 4 — admin-gated surfaces: audit log, invite codes.

import { test, expect } from "../support/fixtures";
import { gql } from "../support/helpers/seed";
import { graphqlAs } from "../support/helpers/graphql";
import { adminApi } from "../support/helpers/seed";

test("audit log: admin can query, read cannot", async () => {
  const QUERY = `query { queryModAudits(input:{page:1, per_page:1}) { count } }`;
  const admin = await adminApi();
  const adminRes = await admin.post("/graphql", {
    data: { query: QUERY },
    headers: { "content-type": "application/json" },
  });
  const adminBody = (await adminRes.json()) as { errors?: unknown[] };
  expect(adminBody.errors ?? []).toEqual([]);
  await admin.dispose();

  const read = await graphqlAs("e2e_read");
  const readRes = await read.post("/graphql", {
    data: { query: QUERY },
    headers: { "content-type": "application/json" },
  });
  // Server may surface unauthorized as a GraphQL error (200 + errors[]) or as
  // an HTTP 401 with a plain-text body. Either is acceptable; the assertion
  // is that the read user could not query the audit log.
  if (readRes.status() === 200) {
    const body = (await readRes.json()) as { errors?: { message: string }[] };
    expect(body.errors?.[0]?.message ?? "").toMatch(/not authorized/i);
  } else {
    expect(readRes.status()).toBeGreaterThanOrEqual(400);
  }
  await read.dispose();
});

test("audit log page is reachable by admin, denied to read", async ({
  adminPage,
  readPage,
}) => {
  // Admin should land on the audits page; the heading is "Moderator Audit Logs".
  await adminPage.goto("/audits");
  await expect(
    adminPage.getByRole("heading", { name: "Moderator Audit Logs" }),
  ).toBeVisible({ timeout: 10_000 });

  // Read-role user: the route's data load returns an unauthorized error, so
  // the page renders an error message. Just assert the heading isn't shown.
  await readPage.goto("/audits");
  await expect(
    readPage.getByRole("heading", { name: "Moderator Audit Logs" }),
  ).toHaveCount(0);
});

test("admin can generate invite codes; read user cannot", async () => {
  const MUTATION = `mutation { generateInviteCodes(input:{keys:1, uses:1, ttl:86400}) }`;
  const admin = await adminApi();
  const result = await gql<{ generateInviteCodes: string[] }>(admin, MUTATION);
  expect(result.generateInviteCodes.length).toBeGreaterThanOrEqual(1);
  await admin.dispose();

  const read = await graphqlAs("e2e_read");
  const readRes = await read.post("/graphql", {
    data: { query: MUTATION },
    headers: { "content-type": "application/json" },
  });
  if (readRes.status() === 200) {
    const body = (await readRes.json()) as { errors?: { message: string }[] };
    expect(body.errors?.length ?? 0).toBeGreaterThan(0);
  } else {
    expect(readRes.status()).toBeGreaterThanOrEqual(400);
  }
  await read.dispose();
});
