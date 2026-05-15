// End-to-end journey: a regular EDIT user logs in via the UI (no pre-saved
// storageState), submits a studio edit, then logs out. Catches regressions in
// the full session round-trip that role-fixtures bypass.

import { test, expect } from "../support/fixtures";
import { TEST_PASSWORD } from "../support/fixtures";
import { uniq } from "../support/helpers/seed";
import { submitMultiTabEntityForm } from "../support/helpers/forms";
import { loginAs } from "../support/helpers/workflow";

test("EDIT user logs in, submits an edit, and logs out", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await loginAs(page, "e2e_edit", TEST_PASSWORD);

  const name = uniq("Studio");
  await page.goto("/studios/add");
  const editId = await submitMultiTabEntityForm(page, { name });
  expect(editId).toBeTruthy();

  // Logout — the Logout link is in the user menu in the navbar.
  await page.goto("/logout");
  await expect(page.getByPlaceholder("Username")).toBeVisible({
    timeout: 10_000,
  });

  await ctx.close();
});
