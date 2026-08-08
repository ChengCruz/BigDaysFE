// docs/qa/playwright.qa.config.ts
// Browser config for the REAL local stack (Caddy → FE :8080, BE :7000).
// Deliberately separate from the repo's playwright.config.ts, which boots its own
// vite server against a MOCK api. Nothing here is mocked.
//
// Run: npx playwright test -c docs/qa/playwright.qa.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: /(guest-page|admin-side)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 150_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "evidence/browser-report" }]],
  outputDir: "evidence/browser-artifacts",
  use: {
    baseURL: "http://mbd.localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    // Guest invite is a phone-first page; the admin app is a desktop layout.
    { name: "mobile", testMatch: /guest-page\.spec\.ts/,
      use: { ...devices["Pixel 5"], viewport: { width: 393, height: 851 } } },
    { name: "desktop", testMatch: /admin-side\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
