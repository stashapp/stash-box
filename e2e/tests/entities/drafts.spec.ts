// Drafts: stash-app posts a draft via GraphQL, the user sees it under
// /drafts, finalises it into a real edit, then approves. The finalize path
// reuses the standard entity form, so the test focuses on the draft-specific
// surface (submission → list → load → carry data into the form).

import { test, expect } from "../../support/fixtures";
import {
  adminApi,
  createStudio,
  gql,
  randomHex,
  uniq,
} from "../../support/helpers/seed";
import { graphqlAs } from "../../support/helpers/graphql";
import { approveEdit } from "../../support/helpers/workflow";

test("submitPerformerDraft → /drafts → finalize → approve → performer exists", async ({
  editPage,
  moderatePage,
}) => {
  const draftName = uniq("DraftPerf");
  const editor = await graphqlAs("e2e_edit");
  const { submitPerformerDraft } = await gql<{
    submitPerformerDraft: { id: string };
  }>(
    editor,
    `mutation($input: PerformerDraftInput!) {
       submitPerformerDraft(input: $input) { id }
     }`,
    {
      input: {
        name: draftName,
        gender: "FEMALE",
        country: "US",
        urls: ["https://example.com/performer"],
      },
    },
  );
  await editor.dispose();
  const draftId = submitPerformerDraft.id;
  expect(draftId).toBeTruthy();

  // /drafts lists the draft for its owner.
  await editPage.goto("/drafts");
  await expect(
    editPage.getByRole("link", { name: new RegExp(draftName) }),
  ).toBeVisible({ timeout: 10_000 });

  // Open the draft and finalise via the standard performer form. The form
  // is pre-filled from the draft.
  await editPage.goto(`/drafts/${draftId}`);
  await editPage.waitForLoadState("networkidle");
  // Name input is required by the schema; keep what came from the draft.
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("draft finalise");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(moderatePage, editId);

  // findPerformer (via name search) should return the just-applied performer.
  const verify = await adminApi();
  const result = await gql<{
    queryPerformers: { performers: { id: string; name: string }[] };
  }>(
    verify,
    `query($name: String!) {
       queryPerformers(input:{names: $name, page:1, per_page:5}) {
         performers { id name }
       }
     }`,
    { name: draftName },
  );
  await verify.dispose();
  expect(result.queryPerformers.performers.map((p) => p.name)).toContain(
    draftName,
  );
});

test("submitSceneDraft → /drafts → finalize → approve → scene exists", async ({
  editPage,
  moderatePage,
}) => {
  const admin = await adminApi();
  const studio = await createStudio(admin, { name: uniq("DraftStudio") });
  await admin.dispose();

  const draftTitle = uniq("DraftScene");
  const editor = await graphqlAs("e2e_edit");
  const { submitSceneDraft } = await gql<{
    submitSceneDraft: { id: string };
  }>(
    editor,
    `mutation($input: SceneDraftInput!) {
       submitSceneDraft(input: $input) { id }
     }`,
    {
      input: {
        title: draftTitle,
        date: "2025-02-15",
        studio: { name: studio.name, id: studio.id },
        performers: [],
        fingerprints: [
          { hash: randomHex(16), algorithm: "OSHASH", duration: 600 },
        ],
      },
    },
  );
  await editor.dispose();
  const draftId = submitSceneDraft.id;
  expect(draftId).toBeTruthy();

  await editPage.goto("/drafts");
  await expect(
    editPage.getByRole("link", { name: new RegExp(draftTitle) }),
  ).toBeVisible({ timeout: 10_000 });

  await editPage.goto(`/drafts/${draftId}`);
  await editPage.waitForLoadState("networkidle");
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("scene draft finalise");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(moderatePage, editId);

  // Confirm the scene exists with the draft's title.
  const verify = await adminApi();
  const result = await gql<{
    queryScenes: { scenes: { id: string; title: string | null }[] };
  }>(
    verify,
    `query($title: String!) {
       queryScenes(input:{title: $title, page:1, per_page:5}) {
         scenes { id title }
       }
     }`,
    { title: draftTitle },
  );
  await verify.dispose();
  expect(result.queryScenes.scenes.map((s) => s.title)).toContain(draftTitle);
});

test("destroyDraft removes the draft from /drafts and findDraft", async ({
  editPage,
}) => {
  const editor = await graphqlAs("e2e_edit");
  const { submitPerformerDraft } = await gql<{
    submitPerformerDraft: { id: string };
  }>(
    editor,
    `mutation($input: PerformerDraftInput!) {
       submitPerformerDraft(input: $input) { id }
     }`,
    { input: { name: uniq("DraftToKill") } },
  );
  const draftId = submitPerformerDraft.id;

  await gql(
    editor,
    `mutation($id: ID!) { destroyDraft(id: $id) }`,
    { id: draftId },
  );

  // findDraft should now return null for the removed draft.
  const data = await gql<{ findDraft: { id: string } | null }>(
    editor,
    `query($id: ID!) { findDraft(id: $id) { id } }`,
    { id: draftId },
  );
  await editor.dispose();
  expect(data.findDraft).toBeNull();

  // And the /drafts list shouldn't show the row anymore. We don't assert
  // the count (other tests pollute the list); just that *this* draft id is
  // not linked.
  await editPage.goto("/drafts");
  await expect(
    editPage.locator(`a[href="/drafts/${draftId}"]`),
  ).toHaveCount(0);
});
