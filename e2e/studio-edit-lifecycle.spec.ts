import { test, expect } from "./fixtures";
import { uniq } from "./helpers/seed";
import { submitMultiTabEntityForm } from "./helpers/forms";
import { approveEdit } from "./helpers/workflow";

test("create studio via edit, approve, verify visible", async ({
  editPage,
  adminPage,
}) => {
  // NOTE: Edit.tsx only shows the Approve Edit button when (isAdmin ||
  // isSelf), so a non-owner moderator has no UI path to approve at the
  // moment. Driving the approval as admin matches what the frontend exposes.
  const name = uniq("Studio");

  await editPage.goto("/studios/add");
  const editId = await submitMultiTabEntityForm(editPage, { name });
  expect(editId).toBeTruthy();

  await approveEdit(adminPage, editId);
  // approveEdit navigates to the entity's detail page; assert the studio name
  // is on whatever page we land on. The studios index is paginated/sorted by
  // name, so a recent test studio may sit on a later page.
  await expect(adminPage.getByText(name).first()).toBeVisible({
    timeout: 15_000,
  });
});
