import { test, expect } from "./fixtures";
import { uniq } from "./helpers/seed";
import {
  submitMultiTabEntityForm,
  expectEntityVisible,
} from "./helpers/forms";
import { approveEdit } from "./helpers/workflow";

test("create performer via edit, approve, verify visible", async ({
  editPage,
  adminPage,
}) => {
  const name = uniq("Performer");

  await editPage.goto("/performers/add");
  // Performer schema requires gender (yup oneOf). The form has a gender select
  // — we set it to FEMALE before moving on to Confirm.
  await editPage.locator('select[name="gender"]').selectOption("FEMALE");
  const editId = await submitMultiTabEntityForm(editPage, { name });
  expect(editId).toBeTruthy();

  await approveEdit(adminPage, editId);
  await expectEntityVisible(adminPage, "/performers", name);
});
