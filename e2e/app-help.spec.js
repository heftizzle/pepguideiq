// e2e/app-help.spec.js
//
// Runs with: pnpm run test:e2e
// Requires:  e2e/.env → E2E_TEST_EMAIL / E2E_TEST_PASSWORD (same as tutorial.spec.js)
//
// Two suites:
//   1. smoke  — real Worker call; serial to avoid KV cap interleave on shared E2E account
//   2. mocked — page.route intercept; 429 exhausted UI without burning KV quota (CI-safe)

import { test, expect } from "@playwright/test";
import {
  dismissTutorialIfPresent,
  passAgeGateIfPresent,
  waitForOverlaysToClear,
} from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function openHamburger(page) {
  return page.getByRole("button", { name: "Open account menu" }).click();
}

async function openAppHelp(page) {
  await openHamburger(page);
  await page.getByRole("button", { name: /app help/i }).click();
}

function getDialog(page) {
  return page.getByRole("dialog", { name: "App Help" });
}

// ─── Suite 1: Smoke (real Worker) ─────────────────────────────────────────────

test.describe("App Help — smoke", () => {
  // Serial: playwright.config.js sets fullyParallel: true; parallel workers
  // would stack POSTs on the shared E2E account and hit the 10/day KV cap mid-run.
  test.describe.configure({ mode: "serial" });

  test.skip(!HAS_CREDS, "Skipping: E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set in e2e/.env");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await passAgeGateIfPresent(page);
    await dismissTutorialIfPresent(page);
    await waitForOverlaysToClear(page);
  });

  test("hamburger contains App Help row", async ({ page }) => {
    await openHamburger(page);
    await expect(page.getByRole("button", { name: /app help/i })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("opens App Help dialog", async ({ page }) => {
    await openAppHelp(page);
    const dialog = getDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  test("shows suggested prompts on empty state", async ({ page }) => {
    await openAppHelp(page);
    const dialog = getDialog(page);
    await expect(dialog.getByText(/where is kpv/i)).toBeVisible();
    await expect(dialog.getByText(/how do i log a dose/i)).toBeVisible();
  });

  test("sends message via suggested chip → hits /v1/app-help only", async ({ page }) => {
    // Register listener before actions that fire the POST
    const postUrls = [];
    page.on("request", (req) => {
      if (req.method() === "POST") postUrls.push(req.url());
    });

    await openAppHelp(page);
    const dialog = getDialog(page);

    await dialog.getByText(/where is kpv/i).first().click();

    const workerResp = await page.waitForResponse(
      (resp) => resp.url().includes("/v1/app-help") && resp.request().method() === "POST",
      { timeout: 15000 }
    );

    expect(workerResp.status()).toBe(200);
    expect(postUrls.some((url) => url.includes("/v1/app-help"))).toBe(true);

    // No direct Anthropic call from the browser — Worker-only path
    expect(postUrls.find((url) => url.includes("api.anthropic.com"))).toBeUndefined();

    // User bubble + assistant bubble
    await expect(dialog.locator("[style*='pre-wrap']")).toHaveCount(2);
  });

  test("sends message via textarea + Enter → receives assistant reply", async ({ page }) => {
    await openAppHelp(page);
    const dialog = getDialog(page);

    const textarea = dialog.locator("textarea");
    await textarea.fill("How do I change my theme?");

    const workerResp = page.waitForResponse(
      (resp) => resp.url().includes("/v1/app-help") && resp.request().method() === "POST",
      { timeout: 15000 }
    );
    await textarea.press("Enter");
    await workerResp;

    await expect(dialog.locator("[style*='pre-wrap']")).toHaveCount(2);
  });

  test("counter header stays visible after send", async ({ page }) => {
    await openAppHelp(page);
    const dialog = getDialog(page);

    const header = dialog.locator("p").filter({ hasText: /remaining today/i });
    await expect(header).toBeVisible();

    const workerResp = page.waitForResponse(
      (resp) => resp.url().includes("/v1/app-help"),
      { timeout: 15000 }
    );
    await dialog.locator("textarea").fill("Where is the Stack tab?");
    await dialog.locator("textarea").press("Enter");
    await workerResp;

    // Exact count depends on prior test-account state; just assert element still renders
    await expect(header).toBeVisible();
  });

  test("Clear button resets conversation to empty state", async ({ page }) => {
    await openAppHelp(page);
    const dialog = getDialog(page);

    const workerResp = page.waitForResponse(
      (resp) => resp.url().includes("/v1/app-help"),
      { timeout: 15000 }
    );
    await dialog.locator("textarea").fill("Test message");
    await dialog.locator("textarea").press("Enter");
    await workerResp;

    const clearBtn = dialog.getByRole("button", { name: /clear/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    await expect(dialog.getByText(/where is kpv/i)).toBeVisible();
    await expect(dialog.locator("[style*='pre-wrap']")).toHaveCount(0);
  });

  test("backdrop click closes dialog", async ({ page }) => {
    await openAppHelp(page);
    await expect(getDialog(page)).toBeVisible();

    // Click top of viewport — outside the 72dvh sheet
    // If this flakes, add data-testid to the backdrop div in the modal
    await page.mouse.click(200, 50);

    await expect(getDialog(page)).not.toBeVisible();
  });

  test("close button closes dialog", async ({ page }) => {
    await openAppHelp(page);
    const dialog = getDialog(page);
    await dialog.getByRole("button", { name: "Close App Help" }).click();
    await expect(dialog).not.toBeVisible();
  });
});

// ─── Suite 2: Mocked — 429 exhausted UI (no real KV burn, CI-safe) ───────────

test.describe("App Help — 429 exhausted (mocked)", () => {
  test.skip(!HAS_CREDS, "Skipping: E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set in e2e/.env");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await passAgeGateIfPresent(page);
    await dismissTutorialIfPresent(page);
    await waitForOverlaysToClear(page);
  });

  test("shows exhausted copy when Worker returns 429", async ({ page }) => {
    await page.route("**/v1/app-help", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: "daily_limit_reached",
          usage: { queries_today: 10, queries_limit: 10 },
        }),
      })
    );

    await openAppHelp(page);
    const dialog = getDialog(page);

    await dialog.locator("textarea").fill("Where is KPV?");
    await dialog.locator("textarea").press("Enter");

    await expect(
      dialog.getByText(/you've used all 10 app help questions today/i)
    ).toBeVisible({ timeout: 5000 });

    await expect(dialog.getByText(/daily limit reached/i)).toBeVisible();
  });

  test("textarea and send button disabled after 429", async ({ page }) => {
    await page.route("**/v1/app-help", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: "daily_limit_reached",
          usage: { queries_today: 10, queries_limit: 10 },
        }),
      })
    );

    await openAppHelp(page);
    const dialog = getDialog(page);

    await dialog.locator("textarea").fill("One more question");
    await dialog.locator("textarea").press("Enter");

    await expect(dialog.getByText(/daily limit reached/i)).toBeVisible({ timeout: 5000 });

    await expect(dialog.locator("textarea")).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  test("mocked 200: response text + counter update", async ({ page }) => {
    await page.route("**/v1/app-help", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          text: "KPV is in the Library tab. Search for it using the search bar.",
          usage: { queries_today: 1, queries_limit: 10 },
        }),
      })
    );

    await openAppHelp(page);
    const dialog = getDialog(page);

    await dialog.locator("textarea").fill("Where is KPV?");
    await dialog.locator("textarea").press("Enter");

    await expect(
      dialog.getByText(/kpv is in the library tab/i)
    ).toBeVisible({ timeout: 5000 });

    await expect(dialog.getByText(/9 of 10 questions remaining today/i)).toBeVisible();
  });
});
