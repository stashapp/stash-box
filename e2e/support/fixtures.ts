import { test as base, expect, type Page, type Browser } from "@playwright/test";
import path from "node:path";

export const TEST_PASSWORD = "E2ETestPassword#2026";

export type RoleName =
  | "admin"
  | "modify"
  | "moderate"
  | "edit"
  | "edit2" // second EDIT user — used to exercise non-owner-but-same-role flows
  | "vote"
  | "read";

export const ROLES: ReadonlyArray<{ key: RoleName; username: string }> = [
  { key: "admin", username: "e2e_admin" },
  { key: "modify", username: "e2e_modify" },
  { key: "moderate", username: "e2e_moderate" },
  { key: "edit", username: "e2e_edit" },
  { key: "edit2", username: "e2e_edit2" },
  { key: "vote", username: "e2e_vote" },
  { key: "read", username: "e2e_read" },
] as const;

// .auth/ lives at the e2e/ root so the gitignore entry stays simple and the
// directory is where you'd expect to find it. __dirname here is e2e/support/.
export const authStateFile = (username: string) =>
  path.resolve(__dirname, "..", ".auth", `${username}.json`);

function makeRoleFixture(username: string) {
  return async (
    { browser }: { browser: Browser },
    use: (page: Page) => Promise<void>,
  ) => {
    const ctx = await browser.newContext({ storageState: authStateFile(username) });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  };
}

type RoleFixtures = {
  adminPage: Page;
  modifyPage: Page;
  moderatePage: Page;
  editPage: Page;
  edit2Page: Page;
  votePage: Page;
  readPage: Page;
};

export const test = base.extend<RoleFixtures>({
  adminPage: makeRoleFixture("e2e_admin"),
  modifyPage: makeRoleFixture("e2e_modify"),
  moderatePage: makeRoleFixture("e2e_moderate"),
  editPage: makeRoleFixture("e2e_edit"),
  edit2Page: makeRoleFixture("e2e_edit2"),
  votePage: makeRoleFixture("e2e_vote"),
  readPage: makeRoleFixture("e2e_read"),
});

export { expect };
