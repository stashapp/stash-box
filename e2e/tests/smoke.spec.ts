import { test, expect } from "../support/fixtures";

test("unauthenticated user is bounced to login", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.getByPlaceholder("Username")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await ctx.close();
});

test("admin can reach the home page", async ({ adminPage }) => {
  await adminPage.goto("/");
  await expect(adminPage).toHaveURL(/.*\/$/);
  // The login form should not be on the page once authenticated.
  await expect(adminPage.getByRole("button", { name: "Login" })).toHaveCount(0);
});

test.describe("entity index pages load for admin", () => {
  for (const path of ["/performers", "/scenes", "/studios", "/tags", "/edits"]) {
    test(`GET ${path}`, async ({ adminPage }) => {
      const res = await adminPage.goto(path);
      expect(res?.status(), `${path} should respond 200`).toBe(200);
    });
  }
});
