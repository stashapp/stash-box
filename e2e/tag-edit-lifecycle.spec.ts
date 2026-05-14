import { test, expect } from "./fixtures";
import { adminApi, createTagCategory, uniq } from "./helpers/seed";
import {
  pickFromSelect,
  submitTagForm,
  expectEntityVisible,
} from "./helpers/forms";
import { approveEdit } from "./helpers/workflow";

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
  await expectEntityVisible(adminPage, "/tags", name);
});
