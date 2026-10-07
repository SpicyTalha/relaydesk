import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Tests talk to Supabase and Stripe directly too, so load the same env files as `next dev`.
for (const file of [".env.development.local", ".env.local"]) if (existsSync(file)) process.loadEnvFile(file);

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  // First visits compile pages in dev mode, which can take several seconds.
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "pnpm dev", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
