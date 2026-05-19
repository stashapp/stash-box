// UI-driven helpers for the edit-detail page. Use these from tests when the
// action under test is the moderation/voting flow itself. For setup ("get me a
// pending edit") prefer the GraphQL helpers in ./seed.ts — much faster.

import { expect, type Page } from "@playwright/test";

/**
 * Log a user in through the Login page. The form briefly detaches on first
 * render while useCurrentUser() resolves — waiting for the network to settle
 * before filling avoids "element was detached" flakes.
 */
export async function loginAs(page: Page, username: string, password: string) {
  await page.goto("/login");
  // Wait for the Login button to be both attached and enabled before
  // touching the inputs. This signals the form has settled past its
  // initial mount/Apollo-resolve cycle that can otherwise detach inputs
  // mid-fill.
  const loginButton = page.getByRole("button", { name: "Login" });
  await loginButton.waitFor({ state: "visible" });
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Username").fill(username);
  await page.getByPlaceholder("Password").fill(password);
  await loginButton.click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}

/**
 * Navigate to an edit page and click "Approve Edit", then confirm in the
 * resulting modal. Caller must be authenticated as MODERATE+ (or as the edit's
 * own ADMIN owner).
 */
export async function approveEdit(page: Page, editId: string) {
  await page.goto(`/edits/${editId}`);
  await page.getByRole("button", { name: "Approve Edit", exact: true }).click();
  // Modal confirms with the literal "Approve edit" (different casing) — use
  // exact:true to disambiguate from the now-disabled trigger button.
  await page.getByRole("button", { name: "Approve edit", exact: true }).click();
  // After approve, app navigates to the target entity with #edits anchor.
  await page.waitForURL((url) => !url.pathname.startsWith("/edits/"), {
    timeout: 15_000,
  });
}

/**
 * Click "Cancel Edit" on the edit page and confirm. Caller must be the edit's
 * owner (or an ADMIN).
 */
export async function cancelEdit(page: Page, editId: string) {
  await page.goto(`/edits/${editId}`);
  await page.getByRole("button", { name: "Cancel Edit" }).click();
  await page.getByRole("button", { name: "Yes, cancel edit" }).click();
}

/** Cast a Yes / No / Abstain vote on the edit. Caller needs VOTE. */
export async function voteOnEdit(
  page: Page,
  editId: string,
  vote: "Yes" | "No" | "Abstain",
) {
  await page.goto(`/edits/${editId}`);
  // VoteBar renders three radios labeled Yes / No / Abstain inside a form
  // group with the edit id in the controlId. A "Save" button appears once a
  // new vote is selected.
  await page.getByText(vote, { exact: true }).first().click();
  await page.getByRole("button", { name: "Save" }).click();
  // Save button disappears once the mutation completes.
  await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0, {
    timeout: 10_000,
  });
}

/** Add a comment to an edit. Caller needs EDIT. */
export async function commentOnEdit(
  page: Page,
  editId: string,
  text: string,
) {
  await page.goto(`/edits/${editId}`);
  await page.getByRole("button", { name: "Add Comment" }).click();
  // NoteInput renders a textarea with name="note" inside the Write tab.
  await page.locator('textarea[name="note"]').fill(text);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(text)).toBeVisible({ timeout: 10_000 });
}
