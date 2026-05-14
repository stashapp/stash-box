// Tier 3 — entity update + delete via the edit lifecycle.
// Studio is the simplest entity to drive end-to-end; performer/tag follow the
// same shape with slightly different forms.

import { test, expect } from "./fixtures";
import {
  adminApi,
  createPerformer,
  createStudio,
  createTag,
  createTagCategory,
  gql,
  uniq,
} from "./helpers/seed";
import { approveEdit } from "./helpers/workflow";

test("studio rename: submit MODIFY edit, approve, name changes", async ({
  editPage,
  adminPage,
}) => {
  const admin = await adminApi();
  const original = await createStudio(admin);
  await admin.dispose();

  const renamed = uniq("StudioRenamed");

  await editPage.goto(`/studios/${original.id}/edit`);
  // Form is pre-filled — clear and overwrite the name.
  const nameInput = editPage.locator('input[name="name"]').first();
  await nameInput.fill(renamed);
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("rename via e2e");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();

  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(adminPage, editId);

  await adminPage.goto(`/studios/${original.id}`);
  await expect(adminPage.getByText(renamed).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("studio delete: submit DESTROY edit, approve, studio marked deleted", async ({
  editPage,
  adminPage,
}) => {
  const admin = await adminApi();
  const toDelete = await createStudio(admin);
  await admin.dispose();

  await editPage.goto(`/studios/${toDelete.id}/delete`);
  await editPage.locator('textarea[name="note"]').fill("delete via e2e");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();

  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(adminPage, editId);

  const admin2 = await adminApi();
  const data = await gql<{ findStudio: { deleted: boolean } | null }>(
    admin2,
    `query($id: ID!) { findStudio(id: $id) { deleted } }`,
    { id: toDelete.id },
  );
  await admin2.dispose();
  expect(data.findStudio?.deleted).toBe(true);
});

test("performer rename: submit MODIFY edit, approve, name changes", async ({
  editPage,
  adminPage,
}) => {
  const admin = await adminApi();
  const original = await createPerformer(admin);
  await admin.dispose();

  const renamed = uniq("PerformerRenamed");

  await editPage.goto(`/performers/${original.id}/edit`);
  await editPage.locator('input[name="name"]').first().fill(renamed);
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("rename via e2e");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();

  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(adminPage, editId);

  await adminPage.goto(`/performers/${original.id}`);
  await expect(adminPage.getByText(renamed).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("performer delete: submit DESTROY edit, approve, performer marked deleted", async ({
  editPage,
  adminPage,
}) => {
  const admin = await adminApi();
  const toDelete = await createPerformer(admin);
  await admin.dispose();

  await editPage.goto(`/performers/${toDelete.id}/delete`);
  await editPage.locator('textarea[name="note"]').fill("delete via e2e");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();

  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(adminPage, editId);

  const admin2 = await adminApi();
  const data = await gql<{ findPerformer: { deleted: boolean } | null }>(
    admin2,
    `query($id: ID!) { findPerformer(id: $id) { deleted } }`,
    { id: toDelete.id },
  );
  await admin2.dispose();
  expect(data.findPerformer?.deleted).toBe(true);
});

test("tag rename: submit MODIFY edit, approve, name changes", async ({
  editPage,
  adminPage,
}) => {
  const admin = await adminApi();
  const category = await createTagCategory(admin);
  const original = await createTag(admin, { categoryId: category.id });
  await admin.dispose();

  const renamed = uniq("TagRenamed");

  await editPage.goto(`/tags/${original.id}/edit`);
  // Tag form is single-page (no tabs).
  await editPage.locator('input[name="name"]').first().fill(renamed);
  await editPage.locator('textarea[name="note"]').fill("rename via e2e");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();

  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(adminPage, editId);

  await adminPage.goto(`/tags/${original.id}`);
  await expect(adminPage.getByText(renamed).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("tag delete: submit DESTROY edit, approve, tag marked deleted", async ({
  editPage,
  adminPage,
}) => {
  const admin = await adminApi();
  const category = await createTagCategory(admin);
  const toDelete = await createTag(admin, { categoryId: category.id });
  await admin.dispose();

  await editPage.goto(`/tags/${toDelete.id}/delete`);
  await editPage.locator('textarea[name="note"]').fill("delete via e2e");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();

  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(adminPage, editId);

  const admin2 = await adminApi();
  const data = await gql<{ findTag: { deleted: boolean } | null }>(
    admin2,
    `query($id: ID!) { findTag(id: $id) { deleted } }`,
    { id: toDelete.id },
  );
  await admin2.dispose();
  expect(data.findTag?.deleted).toBe(true);
});
