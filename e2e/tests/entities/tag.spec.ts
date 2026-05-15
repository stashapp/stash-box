import { test, expect } from "../../support/fixtures";
import { adminApi, createTagCategory, uniq } from "../../support/helpers/seed";
import { pickFromSelect, submitTagForm } from "../../support/helpers/forms";
import { approveEdit } from "../../support/helpers/workflow";

test("create tag via edit, approve, verify visible", async ({
  editPage,
  adminPage,
}) => {
  // Tags need a category. Seed one via GraphQL as admin rather than going
  // through Categories UI in this test.
  const admin = await adminApi();
  const category = await createTagCategory(admin);
  await admin.dispose();

  const name = uniq("Tag");
  await editPage.goto("/tags/add");
  await pickFromSelect(editPage, "Category", category.name);

  const editId = await submitTagForm(editPage, { name });
  expect(editId).toBeTruthy();

  await approveEdit(adminPage, editId);
  // approveEdit lands on the tag's detail page (not the paginated index),
  // so the new tag name is directly visible without scrolling.
  await expect(adminPage.getByText(name).first()).toBeVisible({
    timeout: 15_000,
  });
});
