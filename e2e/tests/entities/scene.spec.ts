import { test, expect } from "../../support/fixtures";
import { adminApi, createStudio, uniq } from "../../support/helpers/seed";
import {
  expectEntityVisible,
  pickFromSelect,
} from "../../support/helpers/forms";
import { approveEdit } from "../../support/helpers/workflow";

test("create scene via edit, approve, verify visible", async ({
  editPage,
  adminPage,
}) => {
  // Scenes require a parent studio. Seed one via GraphQL as admin.
  const admin = await adminApi();
  const studio = await createStudio(admin);
  await admin.dispose();

  const title = uniq("Scene");
  await editPage.goto("/scenes/add");
  await editPage.getByPlaceholder("Title").fill(title);
  await editPage.getByPlaceholder("YYYY-MM-DD").first().fill("2025-01-15");

  await pickFromSelect(editPage, "Studio", studio.name);

  // Scenes use Title (not Name) so we hand-roll the Confirm + submit step
  // rather than calling submitMultiTabEntityForm.
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("e2e test edit");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;
  expect(editId).toBeTruthy();

  await approveEdit(adminPage, editId);
  await expectEntityVisible(adminPage, "/scenes", title);
});
