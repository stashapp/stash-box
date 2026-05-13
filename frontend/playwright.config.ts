import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Where the stash-box Go binary will be listening. Must match e2e/stash-box-config-e2e.yml.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:9997";

// If E2E_NO_WEBSERVER=1 the user is running stash-box + seed themselves;
// Playwright will just connect to BASE_URL.
const manageServer = process.env.E2E_NO_WEBSERVER !== "1";

// Resolve the repo root so the binary path and config flag resolve correctly.
const repoRoot = path.resolve(__dirname, "..");
const configFlag = "--config_file=e2e/stash-box-config-e2e.yml";

// Bootstrap admin credentials. The stash-box binary reads these on startup and
// creates an ADMIN user when is_production is false (see
// cmd/stash-box/main.go:bootstrapAdminFromEnv). global-setup.ts logs in as this
// user to seed the per-role test accounts via GraphQL.
const BOOTSTRAP_USERNAME =
  process.env.STASH_BOX_BOOTSTRAP_ADMIN_USERNAME ?? "e2e_bootstrap";
const BOOTSTRAP_PASSWORD =
  process.env.STASH_BOX_BOOTSTRAP_ADMIN_PASSWORD ?? "E2ETestPassword#2026";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/helpers/**", "**/fixtures.ts", "**/global-setup.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    // Console summary for local runs.
    ["list"],
    // GitHub-flavoured ::error annotations — render inline on the PR diff.
    ...(process.env.CI ? [["github"] as const] : []),
    // Self-contained HTML report uploaded as a CI artifact.
    ["html", { open: "never", outputFolder: "playwright-report" }],
    // JSON for the sticky-PR-comment action.
    ["json", { outputFile: "playwright-report/results.json" }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  globalSetup: "./e2e/global-setup.ts",

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Uncomment once the suite stabilises — Playwright bundles all three engines.
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit",  use: { ...devices["Desktop Safari"] } },
  ],

  webServer: manageServer
    ? {
        // Assumes `make build` has already produced ../stash-box.
        // CI builds it once before invoking Playwright.
        command: `./stash-box ${configFlag}`,
        cwd: repoRoot,
        env: {
          STASH_BOX_BOOTSTRAP_ADMIN_USERNAME: BOOTSTRAP_USERNAME,
          STASH_BOX_BOOTSTRAP_ADMIN_PASSWORD: BOOTSTRAP_PASSWORD,
        },
        // stash-box has no dedicated /healthz; the SPA index responds 200 once ready.
        url: `${BASE_URL}/`,
        timeout: 60_000,
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
});
