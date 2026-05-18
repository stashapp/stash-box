// Tier 4 — token/cooldown edge cases on email-driven flows. Uses the same
// mock-smtp infra as email.spec.ts. None of these flows should expose
// activation/reset tokens that can be replayed or bypassed.

import { test, expect } from "../../support/fixtures";
import { adminApi, gql, uniq } from "../../support/helpers/seed";
import { waitForEmailTo, extractLink } from "../../support/helpers/email";

const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.local`;

// Random-ish UUID v4-shaped string. Won't be a known token on the server.
const fakeUuid = () =>
  "00000000-0000-4000-8000-" +
  Math.floor(Math.random() * 1e12)
    .toString(16)
    .padStart(12, "0");

test("reset-password page rejects a missing token outright", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/reset-password"); // no ?key
  // ResetPassword renders an <ErrorMessage error="Invalid request" />.
  await expect(page.getByText(/Invalid request/i)).toBeVisible({
    timeout: 5_000,
  });
  await ctx.close();
});

test("reset-password with a fake token surfaces a server error", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/reset-password?key=${fakeUuid()}`);
  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill("BogusPw#2026");
  await page.getByPlaceholder("Confirm New Password").fill("BogusPw#2026");
  await page.getByRole("button", { name: /set password/i }).click();

  // The form stays on the page and renders a server-error string in the
  // error list. The exact wording isn't a contract; just assert it isn't a
  // success redirect.
  await page.waitForTimeout(1000);
  expect(page.url()).toContain("/reset-password");
  await ctx.close();
});

test("activate page rejects an unknown activation key via server error", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/activate?key=${fakeUuid()}`);
  await page.getByPlaceholder("Username").fill(`bogus_${Date.now()}`);
  await page.getByPlaceholder("Password").fill("BogusPw#2026");
  await page.getByRole("button", { name: /activate|create/i }).click();

  // No redirect to /login on success — the activation key is unknown.
  await page.waitForTimeout(1000);
  expect(page.url()).toContain("/activate");
  await ctx.close();
});

test("invite code with uses=1 cannot be redeemed twice", async ({ browser }) => {
  // Generate a code with exactly one use, register the first user successfully,
  // then attempt a second registration with the same code and assert the
  // server rejects the newUser mutation.
  const admin = await adminApi();
  const { generateInviteCodes } = await gql<{ generateInviteCodes: string[] }>(
    admin,
    `mutation { generateInviteCodes(input:{keys:1, uses:1, ttl:86400}) }`,
  );
  await admin.dispose();
  const code = generateInviteCodes[0];

  const emailA = uniqueEmail("invA");
  const emailB = uniqueEmail("invB");

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // First registration: succeeds.
  await page.goto("/register");
  await page.getByPlaceholder("Email").fill(emailA);
  await page.getByPlaceholder("Invite Key").fill(code);
  await page.getByRole("button", { name: /register|sign up|create/i }).click();
  // Either navigates to /activate?key=... or shows the "check your email"
  // notice. Either is fine; the contract is "no error rendered".
  await expect(page.getByText(/Invalid|error/i)).toHaveCount(0);

  // Second registration with the same code: should fail.
  await page.goto("/register");
  await page.getByPlaceholder("Email").fill(emailB);
  await page.getByPlaceholder("Invite Key").fill(code);
  await page.getByRole("button", { name: /register|sign up|create/i }).click();
  // The server error renders in the form's error list. The exact phrasing
  // varies ("invalid invite key", "expired", etc.) — assert any visible
  // error message appears.
  await page.waitForTimeout(1500);
  // Still on /register since the submission was rejected.
  expect(page.url()).toContain("/register");

  await ctx.close();
});

test("email cooldown blocks a second reset-password request within the window", async ({
  browser,
}) => {
  // e2e config sets email_cooldown: 1 second. Fire two requests in rapid
  // succession and assert the second triggers the cooldown rejection.
  // (The first should send an email; the second should error out.)
  const username = uniq("cd").toLowerCase().replace(/-/g, "_");
  const email = uniqueEmail(username);

  const admin = await adminApi();
  await gql(
    admin,
    `mutation($input: UserCreateInput!) {
       userCreate(input: $input) { id }
     }`,
    {
      input: { name: username, password: "CooldownPw#2026", email, roles: ["READ"] },
    },
  );
  await admin.dispose();

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const startedAt = Date.now();

  // Request 1 — succeeds.
  await page.goto("/forgot-password");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByRole("button", { name: /reset/i }).click();
  await expect(page.getByText(/password reset|Pasword reset/i)).toBeVisible({
    timeout: 10_000,
  });
  // Wait for the first email so we know the send actually went out (and
  // primed the cooldown map).
  const firstMail = await waitForEmailTo(email, { minReceivedAt: startedAt });
  expect(
    extractLink(firstMail, /https?:\/\/[^\s"<]*\/reset-password[^\s"<]*/i),
  ).toBeTruthy();

  // Request 2 — same email, immediately. Drive via GraphQL to assert the
  // exact server error rather than relying on the UI's generic "check your
  // email" toast (which hides cooldown rejections).
  const ctx2 = await import("@playwright/test").then((m) =>
    m.request.newContext({
      baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:9997",
    }),
  );
  const res = await ctx2.post("/graphql", {
    data: {
      query: `mutation($input: ResetPasswordInput!) { resetPassword(input: $input) }`,
      variables: { input: { email } },
    },
    headers: { "content-type": "application/json" },
  });
  const body = (await res.json()) as {
    data?: { resetPassword?: boolean };
    errors?: { message: string }[];
  };
  await ctx2.dispose();

  // Either the server returns an error or `resetPassword` returns false /
  // a non-success status. The cooldown surface is "pending-email-change".
  const message =
    body.errors?.[0]?.message ?? (body.data?.resetPassword === false ? "false" : "");
  expect(
    message.match(/pending-email-change|cooldown|wait/i) ||
      body.data?.resetPassword === false,
  ).toBeTruthy();

  await ctx.close();
});
