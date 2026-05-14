// Tier 3 — client-side validation. The studio form's yup schema requires
// `name` and `note`. We submit empty and assert the inline error and the URL
// staying on /studios/add (no edit gets created).

import { test, expect } from "./fixtures";

test("studio create: empty name blocks submission and surfaces inline error", async ({
  editPage,
}) => {
  await editPage.goto("/studios/add");
  // Skip Name on Details tab, jump straight to Confirm.
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("attempt without name");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();

  // react-hook-form should keep us on the form — no /edits/:id redirect.
  await editPage.waitForTimeout(1000);
  expect(editPage.url()).toMatch(/\/studios\/add$/);

  // The name field's `.invalid-feedback` lives on the Details tab, which is
  // hidden while we're on Confirm; assert via the is-invalid class on the
  // underlying input instead (always in the DOM).
  await expect(
    editPage.locator('input[name="name"].is-invalid'),
  ).toBeAttached();
});
