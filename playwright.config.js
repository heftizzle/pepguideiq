import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnvFile(relativePath) {
  const envPath = path.resolve(process.cwd(), relativePath);
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!key) continue;
    if (process.env[key] == null) process.env[key] = value;
  }
}

loadDotEnvFile("e2e/.env");

export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.js", "tests/**/*.spec.js"],
  testIgnore: [/\/(node_modules|dist)\//],
  globalSetup: "./e2e/global-setup.js",
  timeout: 60_000, // default would be 30_000
  expect: {
    timeout: 10_000, // default is 5s
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /auth\.spec\.js/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/user.json",
      },
    },
    {
      name: "chromium-auth",
      testMatch: /auth\.spec\.js/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    },
    timeout: 120_000,
  },
});
