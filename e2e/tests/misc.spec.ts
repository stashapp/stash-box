// Catch-all small assertions: surfaces that are too lightweight to deserve
// their own spec file but worth covering for regression protection.

import { expect, devices } from "@playwright/test";
import { test, authStateFile } from "../support/fixtures";
import {
  adminApi,
  createPerformer,
  createStudio,
  gql,
  submitStudioCreateEdit,
  uniq,
} from "../support/helpers/seed";
import { graphqlAs } from "../support/helpers/graphql";
import { voteOnEdit } from "../support/helpers/workflow";

test("/version page renders the build metadata", async ({ adminPage }) => {
  await adminPage.goto("/version");
  // The page renders a definition list with "Version" and "Build Type" <dt>s
  // once the useVersion query resolves.
  await expect(adminPage.getByText("Version", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(adminPage.getByText("Build Type", { exact: true })).toBeVisible();
});

test("favoritePerformer toggles is_favorite", async () => {
  const admin = await adminApi();
  const perf = await createPerformer(admin);

  await gql(
    admin,
    `mutation($id: ID!, $favorite: Boolean!) {
       favoritePerformer(id: $id, favorite: $favorite)
     }`,
    { id: perf.id, favorite: true },
  );
  const after = await gql<{ findPerformer: { is_favorite: boolean } | null }>(
    admin,
    `query($id: ID!) { findPerformer(id: $id) { is_favorite } }`,
    { id: perf.id },
  );
  expect(after.findPerformer?.is_favorite).toBe(true);

  await gql(
    admin,
    `mutation($id: ID!, $favorite: Boolean!) {
       favoritePerformer(id: $id, favorite: $favorite)
     }`,
    { id: perf.id, favorite: false },
  );
  const cleared = await gql<{ findPerformer: { is_favorite: boolean } | null }>(
    admin,
    `query($id: ID!) { findPerformer(id: $id) { is_favorite } }`,
    { id: perf.id },
  );
  expect(cleared.findPerformer?.is_favorite).toBe(false);
  await admin.dispose();
});

test("favoriteStudio toggles is_favorite", async () => {
  const admin = await adminApi();
  const studio = await createStudio(admin);

  await gql(
    admin,
    `mutation($id: ID!, $favorite: Boolean!) {
       favoriteStudio(id: $id, favorite: $favorite)
     }`,
    { id: studio.id, favorite: true },
  );
  const after = await gql<{ findStudio: { is_favorite: boolean } | null }>(
    admin,
    `query($id: ID!) { findStudio(id: $id) { is_favorite } }`,
    { id: studio.id },
  );
  expect(after.findStudio?.is_favorite).toBe(true);
  await admin.dispose();
});

test("non-owner cannot cancel someone else's edit", async () => {
  // The cancelEdit resolver should reject EDIT users who are not the owner
  // of the edit (and not admin). e2e_edit owns the edit; e2e_modify tries
  // to cancel it. MODIFY doesn't imply EDIT, so the directive layer rejects
  // before the resolver even runs — either rejection is fine.
  const owner = await graphqlAs("e2e_edit");
  const { id: editId } = await submitStudioCreateEdit(owner, uniq("Studio"));
  await owner.dispose();

  const other = await graphqlAs("e2e_modify");
  const res = await other.post("/graphql", {
    data: {
      query: `mutation($input: CancelEditInput!) {
        cancelEdit(input: $input) { id status }
      }`,
      variables: { input: { id: editId } },
    },
    headers: { "content-type": "application/json" },
  });
  const body = (await res.json()) as { errors?: { message: string }[] };
  await other.dispose();
  expect(body.errors?.length ?? 0).toBeGreaterThan(0);
});

test("edits list status filter narrows results", async ({ adminPage }) => {
  // URL-only smoke for two filter values. We don't assert counts because the
  // shared DB makes them volatile.
  await adminPage.goto("/edits?status=ACCEPTED");
  expect(adminPage.url()).toContain("status=ACCEPTED");
  await adminPage.goto("/edits?status=PENDING");
  expect(adminPage.url()).toContain("status=PENDING");
  await expect(
    adminPage.getByRole("heading", { name: "Edits", exact: true }),
  ).toBeVisible();
});

test("home page renders on a mobile viewport", async ({ browser }) => {
  // Sanity check that the SPA mounts in a narrow viewport — catches CSS
  // regressions that hide the entire navbar. Use admin's auth state so we
  // skip the login bounce.
  const ctx = await browser.newContext({
    ...devices["Pixel 7"],
    storageState: authStateFile("e2e_admin"),
  });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Performers" }).first(),
  ).toBeVisible({ timeout: 10_000 });
  await ctx.close();
});

test("VOTE user can abstain on an edit", async ({ votePage }) => {
  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, uniq("Studio"));
  await editor.dispose();
  await voteOnEdit(votePage, edit.id, "Abstain");
});

test("editComment role gate: READ user is denied", async () => {
  const owner = await graphqlAs("e2e_edit");
  const { id: editId } = await submitStudioCreateEdit(owner, uniq("Studio"));
  await owner.dispose();

  const reader = await graphqlAs("e2e_read");
  const res = await reader.post("/graphql", {
    data: {
      query: `mutation($input: EditCommentInput!) {
        editComment(input: $input) { id }
      }`,
      variables: { input: { id: editId, comment: "denied" } },
    },
    headers: { "content-type": "application/json" },
  });
  const body = (await res.json()) as { errors?: { message: string }[] };
  await reader.dispose();
  expect(body.errors?.[0]?.message ?? "").toMatch(/not authorized/i);
});
