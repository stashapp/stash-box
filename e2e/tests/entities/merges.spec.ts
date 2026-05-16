// Tier 3 — merge edits driven through the actual merge pages
// (PerformerMerge.tsx, TagMerge.tsx). The page wraps a typeahead picker
// (for sources) around the entity's normal edit form, so a UI merge test
// exercises:
//   - the source-picker react-select (now addressable via inputId)
//   - the "Continue" gate on the performer page (mergeActive state)
//   - the per-entity edit form submission path
//   - the edit lifecycle (approve as admin → entity post-conditions)

import { test, expect } from "../../support/fixtures";
import {
  adminApi,
  createPerformer,
  createTag,
  createTagCategory,
  gql,
  uniq,
} from "../../support/helpers/seed";
import { pickFromSelect } from "../../support/helpers/forms";
import { approveEdit } from "../../support/helpers/workflow";

test("performer merge UI: pick source, continue, submit, approve, verify", async ({
  editPage,
  moderatePage,
}) => {
  const admin = await adminApi();
  const target = await createPerformer(admin, { name: uniq("PerfTarget") });
  const source = await createPerformer(admin, { name: uniq("PerfSource") });
  await admin.dispose();

  // The merge page lives on the target's URL.
  await editPage.goto(`/performers/${target.id}/merge`);
  await expect(
    editPage.getByRole("heading", { name: /Merge performers/ }),
  ).toBeVisible();

  // Pick the source via the PerformerSelect typeahead (uses SearchField →
  // react-select with inputId="performer-merge-source-select"). The option's
  // accessible name includes the performer's name.
  await pickFromSelect(
    editPage,
    "Merge sources",
    source.name.slice(0, 10),
    new RegExp(source.name),
  );

  // The "Continue" button appears once a source is selected; clicking it
  // toggles the page into mergeActive mode and renders the PerformerForm.
  await editPage.getByRole("button", { name: "Continue" }).click();

  // Submit the merge edit via the standard multi-tab form.
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("merge via e2e UI");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(moderatePage, editId);

  // Post-conditions via GraphQL.
  const admin2 = await adminApi();
  const result = await gql<{
    findTarget: { deleted: boolean } | null;
    findSource: { deleted: boolean } | null;
  }>(
    admin2,
    `query($t: ID!, $s: ID!) {
       findTarget: findPerformer(id: $t) { deleted }
       findSource: findPerformer(id: $s) { deleted }
     }`,
    { t: target.id, s: source.id },
  );
  await admin2.dispose();
  expect(result.findTarget?.deleted).toBe(false);
  expect(result.findSource?.deleted).toBe(true);
});

test("tag merge UI: pick source, submit, approve, verify", async ({
  editPage,
  moderatePage,
}) => {
  const admin = await adminApi();
  const category = await createTagCategory(admin);
  const target = await createTag(admin, {
    name: uniq("TagTarget"),
    categoryId: category.id,
  });
  const source = await createTag(admin, {
    name: uniq("TagSource"),
    categoryId: category.id,
  });
  await admin.dispose();

  await editPage.goto(`/tags/${target.id}/merge`);
  await expect(
    editPage.getByRole("heading", { name: /Merge tags/ }),
  ).toBeVisible();

  // TagSelect renders the source picker; tag form renders below
  // unconditionally — no "Continue" button.
  await pickFromSelect(
    editPage,
    "Merge sources",
    "TagSource",
    new RegExp(source.name),
  );

  // TagForm is single-page; jump straight to the Submit Edit at the bottom.
  await editPage.locator('textarea[name="note"]').fill("merge via e2e UI");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(moderatePage, editId);

  const admin2 = await adminApi();
  const result = await gql<{
    findTarget: { deleted: boolean } | null;
    findSource: { deleted: boolean } | null;
  }>(
    admin2,
    `query($t: ID!, $s: ID!) {
       findTarget: findTag(id: $t) { deleted }
       findSource: findTag(id: $s) { deleted }
     }`,
    { t: target.id, s: source.id },
  );
  await admin2.dispose();
  expect(result.findTarget?.deleted).toBe(false);
  expect(result.findSource?.deleted).toBe(true);
});
