import { test, expect } from "../../support/fixtures";
import { uniq } from "../../support/helpers/seed";
import { submitMultiTabEntityForm } from "../../support/helpers/forms";
import { approveEdit } from "../../support/helpers/workflow";

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
  // approveEdit lands on the performer detail page; the /performers index is
  // paginated by name and a fresh entry may not be on page 1.
  await expect(adminPage.getByText(name).first()).toBeVisible({
    timeout: 15_000,
  });
});
