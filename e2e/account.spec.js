import { expect, test } from "@playwright/test";
import { dismissTutorialIfPresent, loginUser, passAgeGateIfPresent, waitForOverlaysToClear } from "./helpers/auth.js";

/**
 * Account deletion + session token tests.
 *
 * E2E_TEST_EMAIL / E2E_TEST_PASSWORD     — non-destructive token freshness test
 * E2E_DELETE_EMAIL / E2E_DELETE_PASSWORD — destructive delete flow (throwaway
 *   account only; NEVER use a real/production account)
 */

const DELETE_EMAIL = process.env.E2E_DELETE_EMAIL ?? "";
const DELETE_PASSWORD = process.env.E2E_DELETE_PASSWORD ?? "";
const HAS_DELETE_CREDS =
  !!process.env.E2E_DELETE_EMAIL && !!process.env.E2E_DELETE_PASSWORD;

const MAIN_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const MAIN_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";
const HAS_MAIN_CREDS = Boolean(MAIN_EMAIL && MAIN_PASSWORD);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Opens the hamburger menu then clicks Settings. */
async function openSettings(page) {
  await page
    .getByRole("button", { name: /open account menu/i })
    .or(page.locator("[aria-label='menu'], [aria-label='Open account menu']"))
    .first()
    .click();
  await page.getByText("Settings", { exact: true }).first().click();
  await page.waitForTimeout(500);
}

/** Opens the delete modal via Settings → Delete My Account. */
async function openDeleteModal(page) {
  await openSettings(page);
  const deleteBtn = page
    .getByRole("button", { name: /delete my account/i })
    .or(page.getByText(/delete my account/i))
    .first();
  await deleteBtn.scrollIntoViewIfNeeded();
  await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
  await deleteBtn.click();
  await expect(
    page.getByText(/permanently deletes your account/i)
  ).toBeVisible({ timeout: 5_000 });
}

// ─── Token freshness regression ───────────────────────────────────────────────

test.describe("session token freshness", () => {
  test.skip(
    !HAS_MAIN_CREDS || !process.env.VITE_API_WORKER_URL,
    "No E2E_TEST_EMAIL / E2E_TEST_PASSWORD or VITE_API_WORKER_URL not configured — skipping"
  );

  test("Worker call carries a valid fresh JWT after login", async ({ page }) => {
    await page.goto("/");
    await passAgeGateIfPresent(page);
    await dismissTutorialIfPresent(page);
    await waitForOverlaysToClear(page);

    // Capture Bearer tokens from any Worker request — matches both local Vite
    // proxy (/api-worker → 127.0.0.1:8787) and production Worker URLs.
    const workerTokens = [];
    page.on("request", (req) => {
      const url = req.url();
      const isWorker =
        url.includes("/api-worker") ||
        url.includes(".workers.dev") ||
        url.includes("127.0.0.1:8787") ||
        url.includes("localhost:8787");
      if (!isWorker) return;
      const auth = req.headers()["authorization"] ?? "";
      if (auth.startsWith("Bearer ")) workerTokens.push(auth.slice(7));
    });

    // Navigate to Vial Tracker — fires a Worker call on load.
    await page.getByRole("button", { name: "Vial Tracker" }).click();
    await page.waitForTimeout(2_000);

    // Mandatory: at least one Worker request must have fired so the JWT check
    // is meaningful. If this fails, the nav label or Worker proxy changed.
    expect(workerTokens.length).toBeGreaterThan(0);

    // Every captured token must be a valid three-segment JWT.
    for (const token of workerTokens) {
      const parts = token.split(".");
      expect(parts).toHaveLength(3);
      parts.forEach((p) => expect(p.length).toBeGreaterThan(0));
    }
  });
});

// ─── Delete account flow ──────────────────────────────────────────────────────

test.describe("account deletion", () => {
  test("delete confirmation modal renders correctly and can be dismissed", async ({
    page,
  }) => {
    test.skip(!HAS_DELETE_CREDS, "Skipped: E2E_DELETE_EMAIL / E2E_DELETE_PASSWORD not set");
    await loginUser(page, DELETE_EMAIL, DELETE_PASSWORD);
    await openDeleteModal(page);

    // Both action buttons must be present.
    await expect(
      page.getByRole("button", { name: /never mind/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /yes.*delete everything/i }).first()
    ).toBeVisible();

    // Cancel should dismiss the modal without error.
    await page.getByRole("button", { name: /never mind/i }).first().click();
    await expect(
      page.getByText(/permanently deletes your account/i)
    ).not.toBeVisible({ timeout: 3_000 });

    // No error copy should have appeared.
    await expect(page.getByText(/could not delete account/i)).not.toBeVisible();
  });

  test("delete modal title is not purple", async ({ page }) => {
    test.skip(!HAS_DELETE_CREDS, "Skipped: E2E_DELETE_EMAIL / E2E_DELETE_PASSWORD not set");
    await loginUser(page, DELETE_EMAIL, DELETE_PASSWORD);
    await openDeleteModal(page);

    const title = page.locator('[data-testid="delete-modal-title"]');
    const color = await title.evaluate((el) => getComputedStyle(el).color);

    expect(color).not.toMatch(/rgb\(168,\s*85,\s*247\)/);
    expect(color).not.toMatch(/rgb\(192,\s*132,\s*252\)/);
    expect(color).not.toMatch(/rgb\(124,\s*58,\s*237\)/);
  });

  test("delete account succeeds — no error, user signed out", async ({ page }) => {
    test.skip(!HAS_DELETE_CREDS, "Skipped: E2E_DELETE_EMAIL / E2E_DELETE_PASSWORD not set");
    await loginUser(page, DELETE_EMAIL, DELETE_PASSWORD);

    // Watch for Worker 4xx / 5xx on the delete endpoint.
    const workerErrors = [];
    page.on("response", (res) => {
      const url = res.url();
      const isWorkerError =
        (url.includes("/account/delete") ||
          url.includes("/api-worker") ||
          url.includes(".workers.dev") ||
          url.includes("127.0.0.1:8787") ||
          url.includes("localhost:8787")) &&
        !res.ok();
      if (isWorkerError) workerErrors.push({ url, status: res.status() });
    });

    await openDeleteModal(page);

    // Confirm deletion.
    await page
      .getByRole("button", { name: /yes.*delete everything/i })
      .first()
      .click();

    // Must NOT show the error — this is the stale-token regression assertion.
    await expect(page.getByText(/could not delete account/i)).not.toBeVisible({
      timeout: 8_000,
    });

    // No Worker errors.
    expect(workerErrors).toHaveLength(0);

    // User should be signed out — auth entry point visible.
    await expect(
      page
        .getByRole("button", { name: /sign in|log in|get started/i })
        .or(page.getByTestId("auth-toggle"))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
