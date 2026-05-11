import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dismissTutorialIfPresent, loginUser } from "./helpers/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

async function globalSetup() {
  loadDotEnvFile("e2e/.env");
  if (!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD) {
    throw new Error("Missing E2E_TEST_EMAIL / E2E_TEST_PASSWORD for Playwright global setup");
  }

  const authDir = path.join(__dirname, ".auth");
  mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
  });
  const page = await context.newPage();

  await loginUser(page, process.env.E2E_TEST_EMAIL, process.env.E2E_TEST_PASSWORD);
  await dismissTutorialIfPresent(page);

  await context.storageState({
    path: path.join(authDir, "user.json"),
  });

  await context.close();
  await browser.close();
}

export default globalSetup;
