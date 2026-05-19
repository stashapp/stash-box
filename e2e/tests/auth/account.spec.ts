// Tier 4 — account self-service flows for the logged-in user.

import { test, expect } from "../../support/fixtures";
import { TEST_PASSWORD } from "../../support/fixtures";
import { adminApi, gql, uniq } from "../../support/helpers/seed";
import { graphqlAs } from "../../support/helpers/graphql";
import { loginAs } from "../../support/helpers/workflow";

test("change own password, log in with new password", async ({ browser }) => {
  // Create a throwaway user so we don't mutate the password of one of the
  // shared role fixtures. Failures here used to cascade because the test
  // restored the seeded user's password and a mid-test crash left it
  // mismatched.
  const username = uniq("acct").toLowerCase().replace(/-/g, "_");
  const admin = await adminApi();
  await gql(
    admin,
    `mutation($input: UserCreateInput!) {
       userCreate(input: $input) { id }
     }`,
    {
      input: {
        name: username,
        password: TEST_PASSWORD,
        email: `${username}@example.com`,
        roles: ["READ"],
      },
    },
  );
  await admin.dispose();

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const newPassword = "NewE2EPassword#2026";

  await loginAs(page, username, TEST_PASSWORD);

  await page.goto("/users/change-password");
  // The Save handler closes over `user` from useCurrentUser() — if useAuth()
  // hasn't resolved yet, navigate() after the mutation is skipped and the
  // waitForURL below times out. Wait for the navbar to surface the username
  // (rendered only once Me has loaded) before filling and submitting.
  await page
    .getByRole("link", { name: new RegExp(`^${username}$`) })
    .waitFor({ state: "visible" });
  await page.getByPlaceholder("Existing Password").fill(TEST_PASSWORD);
  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill(newPassword);
  await page.getByPlaceholder("Confirm New Password").fill(newPassword);
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await page.waitForURL(new RegExp(`/users/${username}`), { timeout: 15_000 });

  // Verify the new password actually authenticates by going through /login.
  // page.goto("/logout") hits the backend route that clears the session
  // cookie, but the cached user in localStorage survives the navigation.
  // The Login page redirects away from /login while useAuth() is loading and
  // still seeing that cached user, which makes loginAs flake on retries.
  await page.goto("/logout");
  await page.evaluate(() => localStorage.clear());
  await loginAs(page, username, newPassword);

  await ctx.close();
});

test("regenerate API key issues a new key and invalidates the old one", async () => {
  // Drive via GraphQL — `regenerateAPIKey` is a single mutation; testing the
  // UI button click on top would only validate the click handler. The
  // behavioral check (old key stops working, new key works) is what matters.
  const api = await graphqlAs("e2e_read");

  // Fetch current key.
  const before = await gql<{ me: { api_key: string } }>(
    api,
    `query { me { api_key } }`,
  );
  const oldKey = before.me.api_key;
  expect(oldKey).toBeTruthy();

  // Regenerate (no userID = self).
  const regen = await gql<{ regenerateAPIKey: string }>(
    api,
    `mutation { regenerateAPIKey }`,
  );
  const newKey = regen.regenerateAPIKey;
  expect(newKey).toBeTruthy();
  expect(newKey).not.toBe(oldKey);

  // The api context we already have was authenticated by session, not
  // ApiKey header, so it should still work. But a request with the old key
  // should fail. We use Playwright's request directly to test the header
  // path.
  const { request } = await import("@playwright/test");
  const stale = await request.newContext({
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:9997",
    extraHTTPHeaders: { ApiKey: oldKey },
  });
  const res = await stale.post("/graphql", {
    data: { query: "query { me { name } }" },
    headers: { "content-type": "application/json" },
  });
  // The auth middleware returns 401 when the stored key for the user differs
  // from the one presented.
  expect(res.status()).toBe(401);
  await stale.dispose();
  await api.dispose();
});
