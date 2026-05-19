// Tier 4 — search + list-page behavior. Search and pagination are
// load-bearing for users browsing the catalogue; keep this small but cover
// the smoke shape.

import { test, expect } from "../support/fixtures";
import { adminApi, createPerformer, uniq } from "../support/helpers/seed";

test("global search returns a seeded performer", async ({ adminPage }) => {
  const admin = await adminApi();
  const target = await createPerformer(admin, { name: uniq("Searchable") });
  await admin.dispose();

  // SearchAll only renders the top 10 ranked results. Many previous test runs
  // leave `Searchable-*` performers in the DB, so a "Searchable-" prefix
  // search may not include the newly-seeded one. Search by the unique random
  // suffix from uniq() — paradedb.match tokenises on `-` so the suffix is its
  // own token and only matches this performer.
  const uniqueToken = target.name.split("-").pop() ?? target.name;

  await adminPage.goto(`/search?q=${uniqueToken}`);
  await expect(adminPage.getByText(target.name).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("/edits status filter persists in URL", async ({ adminPage }) => {
  // Smoke check that hitting /edits?status=ACCEPTED renders the page and
  // doesn't redirect; we don't try to assert filter content because the
  // shared DB state across tests makes counts unstable.
  await adminPage.goto("/edits?status=ACCEPTED");
  expect(adminPage.url()).toMatch(/[?&]status=ACCEPTED/);
  await expect(
    adminPage.getByRole("heading", { name: "Edits", exact: true }),
  ).toBeVisible();
});

test("studios list paginates: page=2 URL stays on /studios", async ({
  adminPage,
}) => {
  // Cheaply assert the pagination URL pattern works. Real pagination behavior
  // (clicking next, page=2) depends on having >40 studios; instead we hit
  // page=2 directly and assert the page renders without errors.
  await adminPage.goto("/studios?page=2");
  expect(adminPage.url()).toContain("/studios");
  // Filter input is present even on an empty page.
  await expect(
    adminPage.getByPlaceholder("Filter studio name"),
  ).toBeVisible();
});
