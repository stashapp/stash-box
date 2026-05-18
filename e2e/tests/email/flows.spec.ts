// Email-driven workflows. The e2e config (stash-box-config-e2e.yml) points
// stash-box at e2e/mock-smtp/server.mts on :1025, which captures SMTP into an
// in-memory store readable via HTTP on :1080. Each test seeds a throwaway
// user with a unique email so concurrent runs don't pull each other's mail.

import { test, expect } from "../../support/fixtures";
import { adminApi, gql, uniq } from "../../support/helpers/seed";
import { waitForEmailTo, extractLink } from "../../support/helpers/email";
import { loginAs } from "../../support/helpers/workflow";

const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.local`;

test("forgot password: request → receive email → reset → log in", async ({
  browser,
}) => {
  // Seed a throwaway user with a known password.
  const username = uniq("fp").toLowerCase().replace(/-/g, "_");
  const email = uniqueEmail(username);
  const password = "ForgotPwInitial#2026";

  const admin = await adminApi();
  await gql(
    admin,
    `mutation($input: UserCreateInput!) {
       userCreate(input: $input) { id }
     }`,
    {
      input: { name: username, password, email, roles: ["READ"] },
    },
  );
  await admin.dispose();

  // No resetEmails() — parallel workers share the mock-smtp buffer. We rely
  // on the `to` + `minReceivedAt` filter in waitForEmailTo to ignore mails
  // belonging to other tests.
  const startedAt = Date.now();

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Request a reset.
  await page.goto("/forgot-password");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByRole("button", { name: /reset/i }).click();
  // ForgotPassword renders a confirmation heading after submission.
  await expect(page.getByText(/Pasword reset|password reset/i)).toBeVisible({
    timeout: 10_000,
  });

  // Pull the reset link out of the email.
  const mail = await waitForEmailTo(email, { minReceivedAt: startedAt });
  const link = extractLink(
    mail,
    /https?:\/\/[^\s"<]*\/reset-password\?key=[0-9a-f-]+/i,
  );
  expect(link, `no reset link in mail body:\n${mail.text}`).toBeTruthy();

  // Visit the link and set a new password.
  const newPassword = "ForgotPwReset#2026";
  await page.goto(link!);
  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill(newPassword);
  await page.getByPlaceholder("Confirm New Password").fill(newPassword);
  await page.getByRole("button", { name: /set password/i }).click();
  // The app redirects to /login?msg=password-reset on success.
  await page.waitForURL(/\/login.*password-reset/, { timeout: 10_000 });

  // Confirm the new password works.
  await loginAs(page, username, newPassword);

  await ctx.close();
});

test("register form: omits invite field and submits without one when require_invite=false", async ({
  browser,
}) => {
  // The server's e2e config has require_invite: true, so we can't fully drive
  // the no-invite registration end-to-end against it. Instead we mock the
  // Config query in the browser so the form behaves as it would on an
  // open-registration deployment, then assert:
  //   1. The Invite Key field is not rendered
  //   2. Submitting with just an email doesn't fail yup validation (which is
  //      what used to break: the hidden invite_key was "-", failing the UUID
  //      regex on submit)
  //   3. A newUser mutation is actually fired (proving the click handler ran)
  //      and the payload doesn't carry a bogus placeholder invite key.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Intercept GraphQL requests; for the Config query, rewrite require_invite.
  await page.route("**/graphql", async (route) => {
    const post = route.request().postDataJSON?.();
    const operationName: string | undefined =
      post?.operationName ?? post?.query?.match?.(/(?:query|mutation)\s+(\w+)/)?.[1];
    if (operationName === "Config") {
      const response = await route.fetch();
      const body = await response.json();
      if (body?.data?.getConfig) body.data.getConfig.require_invite = false;
      return route.fulfill({ response, json: body });
    }
    return route.continue();
  });

  await page.goto("/register");

  // Invite Key field should not be rendered.
  await expect(page.getByPlaceholder("Invite Key")).toHaveCount(0);

  // Fill email only; click Register. Capture the newUser request that fires
  // — its presence proves the form passed validation.
  const email = `noinvite-${Date.now()}@example.local`;
  const newUserRequest = page.waitForRequest(
    (req) =>
      req.url().includes("/graphql") &&
      typeof req.postData() === "string" &&
      req.postData()!.includes("newUser"),
    { timeout: 10_000 },
  );
  await page.getByPlaceholder("Email").fill(email);
  await page.getByRole("button", { name: /register|sign up|create/i }).click();
  const req = await newUserRequest;

  const payload = JSON.parse(req.postData() ?? "{}");
  const input = payload?.variables?.input;
  expect(input?.email).toBe(email);
  // No "-" placeholder leaking into the mutation payload.
  expect(input?.invite_key ?? null).toBeNull();

  await ctx.close();
});

test("registration: invite-driven signup → activation email → activate → login", async ({
  browser,
}) => {
  // require_invite is true in the e2e config so we generate a fresh invite
  // code as the bootstrap admin and submit it through the register form. The
  // newUser mutation emails the activation key to the address provided.
  const email = uniqueEmail("reg");
  // No resetEmails() — parallel workers share the mock-smtp buffer. We rely
  // on the `to` + `minReceivedAt` filter in waitForEmailTo to ignore mails
  // belonging to other tests.
  const startedAt = Date.now();

  const admin = await adminApi();
  const invites = await gql<{ generateInviteCodes: string[] }>(
    admin,
    `mutation { generateInviteCodes(input:{keys:1, uses:1, ttl:86400}) }`,
  );
  await admin.dispose();
  const inviteCode = invites.generateInviteCodes[0];
  expect(inviteCode).toBeTruthy();

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto("/register");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Invite Key").fill(inviteCode);
  await page.getByRole("button", { name: /register|sign up|create/i }).click();
  // Register page either navigates to /activate?key=... if the activation
  // key is returned inline, or shows a "check your email" notice. Either
  // path is acceptable; we drive the activate page via the email link.
  const mail = await waitForEmailTo(email, { minReceivedAt: startedAt });
  const link = extractLink(
    mail,
    /https?:\/\/[^\s"<]*\/activate[^\s"<]*/i,
  );
  expect(link, `no activation link in mail:\n${mail.text}`).toBeTruthy();

  await page.goto(link!);
  const newUsername = uniq("reguser").toLowerCase().replace(/-/g, "_");
  const newPassword = "RegPassword#2026";
  await page.getByPlaceholder("Username").fill(newUsername);
  await page.getByPlaceholder("Password").fill(newPassword);
  await page.getByRole("button", { name: /activate|create/i }).click();

  // After activation the app navigates to the login page with a success
  // message; logging in should succeed with the just-set credentials.
  await page.waitForURL(/\/login/, { timeout: 15_000 });
  await loginAs(page, newUsername, newPassword);

  await ctx.close();
});

test("change email: request → confirm-old → submit new → confirm-new → email changed", async ({
  browser,
}) => {
  // Two-step confirmation:
  //   1. Click "Change Email" → email to OLD with /users/<name>/change-email?key=
  //   2. Open that link → submit new email → email to NEW with /users/<name>/confirm-email?key=
  //   3. Open that link → "Complete email change"
  // Final state is asserted via GraphQL (`me { email }`).
  const username = uniq("ce").toLowerCase().replace(/-/g, "_");
  const oldEmail = uniqueEmail(username);
  const newEmail = uniqueEmail(`${username}-new`);
  const password = "ChangeEmailInit#2026";

  const admin = await adminApi();
  await gql(
    admin,
    `mutation($input: UserCreateInput!) {
       userCreate(input: $input) { id }
     }`,
    {
      input: { name: username, password, email: oldEmail, roles: ["READ"] },
    },
  );
  await admin.dispose();

  // No resetEmails() — parallel workers share the mock-smtp buffer. We rely
  // on the `to` + `minReceivedAt` filter in waitForEmailTo to ignore mails
  // belonging to other tests.
  const startedAt = Date.now();

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await loginAs(page, username, password);

  // Step 1: request the change. Triggers an email to the OLD address.
  await page.goto(`/users/${username}`);
  await page.getByRole("button", { name: "Change Email" }).click();

  const oldMail = await waitForEmailTo(oldEmail, { minReceivedAt: startedAt });
  const confirmOldLink = extractLink(
    oldMail,
    /https?:\/\/[^\s"<]*\/users\/[^/\s"<]+\/change-email\?key=[^\s"<]+/i,
  );
  expect(confirmOldLink, `no confirm-old link in mail:\n${oldMail.text}`)
    .toBeTruthy();

  // Step 2: open the OLD-token link, submit the NEW email. Triggers an email
  // to the NEW address.
  await page.goto(confirmOldLink!);
  await page.getByPlaceholder("New email").fill(newEmail);
  await page.getByRole("button", { name: "Change Email" }).click();
  await expect(page.getByText(/Confirmation email sent/i)).toBeVisible({
    timeout: 10_000,
  });

  const newMail = await waitForEmailTo(newEmail, { minReceivedAt: startedAt });
  const confirmNewLink = extractLink(
    newMail,
    /https?:\/\/[^\s"<]*\/users\/[^/\s"<]+\/confirm-email\?key=[^\s"<]+/i,
  );
  expect(confirmNewLink, `no confirm-new link in mail:\n${newMail.text}`)
    .toBeTruthy();

  // Step 3: open the NEW-token link, click the final confirm button.
  await page.goto(confirmNewLink!);
  await page.getByRole("button", { name: "Complete email change" }).click();

  // Settle: poll the user's email via the admin context (graphqlAs assumes
  // TEST_PASSWORD, which doesn't apply to throwaway users). Admin can read
  // any user's private fields via `findUser`.
  const adminCheck = await adminApi();
  await expect
    .poll(
      async () => {
        const r = await adminCheck.post("/graphql", {
          data: {
            query: `query($u: String!) { findUser(username: $u) { email } }`,
            variables: { u: username },
          },
          headers: { "content-type": "application/json" },
        });
        const body = (await r.json()) as {
          data?: { findUser?: { email?: string } | null };
        };
        return body.data?.findUser?.email ?? "";
      },
      { timeout: 10_000, intervals: [200, 500, 1_000] },
    )
    .toBe(newEmail);
  await adminCheck.dispose();

  await ctx.close();
});
