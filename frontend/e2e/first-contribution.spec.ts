// End-to-end journey: a regular EDIT user logs in via the UI (no pre-saved
// storageState), submits a studio edit, then logs out. Catches regressions in
// the full session round-trip that role-fixtures bypass.

import { test, expect } from "./fixtures";
import { TEST_PASSWORD } from "./fixtures";
import { uniq } from "./helpers/seed";
import { submitMultiTabEntityForm } from "./helpers/forms";

test("EDIT user logs in, submits an edit, and logs out", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto("/login");
  await page.getByPlaceholder("Username").fill("e2e_edit");
  await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));

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
