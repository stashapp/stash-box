// Tier 3 — entity update + delete via the edit lifecycle.
// Studio is the cheapest entity to drive end-to-end (single required field,
// no parent dependencies), so the rest of the entity types should follow the
// same pattern when they're added.

import { test, expect } from "./fixtures";
import { adminApi, createStudio, uniq } from "./helpers/seed";
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

  // Visit studio detail directly — index is paginated by name, the renamed
  // entry could be anywhere.
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

  // After deletion the studio detail page should signal the studio is gone —
  // either it 404s in the UI (renders an error) or the studio's badge marks
  // it deleted. Assert via GraphQL since that's the unambiguous check.
  const admin2 = await adminApi();
  const res = await admin2.post("/graphql", {
    data: {
      query: `query($id: ID!) { findStudio(id: $id) { id deleted } }`,
      variables: { id: toDelete.id },
    },
    headers: { "content-type": "application/json" },
  });
  const body = (await res.json()) as {
    data?: { findStudio?: { deleted: boolean } | null };
  };
  await admin2.dispose();
  expect(body.data?.findStudio?.deleted).toBe(true);
});
