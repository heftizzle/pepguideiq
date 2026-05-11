import { expect, test } from "@playwright/test";
import {
  dismissTutorialIfPresent,
  passAgeGateIfPresent,
  waitForOverlaysToClear,
} from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("plan upgrade (stripe)", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  // ---------------------------------------------------------------------------
  // /pricing route (unauthenticated — already in smoke.spec.js, extended here)
  // ---------------------------------------------------------------------------

  test.describe("public pricing page", () => {
    test("all four tier names are visible on /pricing", async ({ page }) => {
      await page.goto("/pricing");
      await passAgeGateIfPresent(page);

      await expect(page.getByText(/entry/i).first()).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText(/pro/i).first()).toBeVisible();
      await expect(page.getByText(/elite/i).first()).toBeVisible();
      await expect(page.getByText(/goat/i).first()).toBeVisible();
    });

    test("tier prices are shown on /pricing", async ({ page }) => {
      await page.goto("/pricing");
      await passAgeGateIfPresent(page);

      await expect(page.getByText(/\$8\.99/)).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText(/\$16\.99/)).toBeVisible();
      await expect(page.getByText(/\$23\.99/)).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // In-app Plan / Upgrade modal
  // ---------------------------------------------------------------------------

  test.describe("authenticated upgrade modal", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await passAgeGateIfPresent(page);
      await dismissTutorialIfPresent(page);
      await waitForOverlaysToClear(page);
    });

    test("Plan / Upgrade opens from account menu", async ({ page }) => {
      await page.getByRole("button", { name: "Open account menu" }).click();
      await page.getByRole("button", { name: "Plan / Upgrade" }).click();

      await expect(page.getByText("Choose your plan")).toBeVisible({ timeout: 8_000 });
    });

    test("upgrade modal shows all four tiers with correct pricing", async ({ page }) => {
      await page.getByRole("button", { name: "Open account menu" }).click();
      await page.getByRole("button", { name: "Plan / Upgrade" }).click();

      await expect(page.getByText("Choose your plan")).toBeVisible({ timeout: 8_000 });

      // Tiers
      await expect(page.getByText("ENTRY")).toBeVisible();
      await expect(page.getByText("Pro", { exact: true })).toBeVisible();
      await expect(page.getByText("ELITE")).toBeVisible();
      await expect(page.getByText("GOAT", { exact: true })).toBeVisible();

      // Prices
      await expect(page.getByText("Free", { exact: true })).toBeVisible();
      await expect(page.getByText(/\$8\.99/)).toBeVisible();
      await expect(page.getByText(/\$16\.99/)).toBeVisible();
      await expect(page.getByText(/\$23\.99/)).toBeVisible();
    });

    test("upgrade modal shows current plan indicator", async ({ page }) => {
      await page.getByRole("button", { name: "Open account menu" }).click();
      await page.getByRole("button", { name: "Plan / Upgrade" }).click();

      await expect(page.getByText("Choose your plan")).toBeVisible({ timeout: 8_000 });

      // One tier must be marked as current
      await expect(page.getByRole("button", { name: "This is your current plan" })).toBeVisible();
    });

    test("upgrade modal shows paid tier CTA buttons", async ({ page }) => {
      await page.getByRole("button", { name: "Open account menu" }).click();
      await page.getByRole("button", { name: "Plan / Upgrade" }).click();

      await expect(page.getByText("Choose your plan")).toBeVisible({ timeout: 8_000 });
      const isGoat = await page.getByText("GOAT TIER").isVisible({ timeout: 3_000 }).catch(() => false);
      test.skip(isGoat, "Account is on GOAT tier — no upgrade CTAs available.");

      // At least one paid upgrade CTA must exist
      const eliteBtn = page.getByRole("button", { name: "Get Elite" });
      const goatBtn = page.getByRole("button", { name: /Go GOAT/i });
      const proBt = page.getByRole("button", { name: /Get Pro/i });

      const hasUpgradeOption =
        (await eliteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) ||
        (await goatBtn.isVisible({ timeout: 3_000 }).catch(() => false)) ||
        (await proBt.isVisible({ timeout: 3_000 }).catch(() => false));

      expect(hasUpgradeOption).toBe(true);
    });

    test("clicking Get Elite redirects to Stripe checkout", async ({ page }) => {
      await page.getByRole("button", { name: "Open account menu" }).click();
      await page.getByRole("button", { name: "Plan / Upgrade" }).click();

      await expect(page.getByText("Choose your plan")).toBeVisible({ timeout: 8_000 });

      const eliteBtn = page.getByRole("button", { name: "Get Elite" });
      const available = await eliteBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      test.skip(!available, "Get Elite not available — may already be on Elite or higher.");

      // Intercept navigation to Stripe — don't actually complete checkout
      const [popup] = await Promise.all([
        page.waitForEvent("popup", { timeout: 8_000 }).catch(() => null),
        page.waitForURL(/stripe\.com|checkout\.stripe/i, { timeout: 8_000 }).catch(() => null),
        eliteBtn.click(),
      ]);

      // Either opened in same tab or popup — Stripe URL must appear
      const currentUrl = popup ? popup.url() : page.url();
      expect(currentUrl).toMatch(/stripe\.com|pepguideiq\.com\/checkout/i);
    });

    test("clicking Go GOAT redirects to Stripe checkout", async ({ page }) => {
      await page.getByRole("button", { name: "Open account menu" }).click();
      await page.getByRole("button", { name: "Plan / Upgrade" }).click();

      await expect(page.getByText("Choose your plan")).toBeVisible({ timeout: 8_000 });

      await page.keyboard.press("End");
      await page.waitForTimeout(500);

      const goatBtn = page.getByRole("button", { name: /Go GOAT/i });
      const available = await goatBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      test.skip(!available, "Go GOAT not available — may already be on GOAT tier.");

      const [popup] = await Promise.all([
        page.waitForEvent("popup", { timeout: 8_000 }).catch(() => null),
        page.waitForURL(/stripe\.com|checkout\.stripe/i, { timeout: 8_000 }).catch(() => null),
        goatBtn.click(),
      ]);

      const currentUrl = popup ? popup.url() : page.url();
      expect(currentUrl).toMatch(/stripe\.com|pepguideiq\.com\/checkout/i);
    });

    test("upgrade modal closes with Close button", async ({ page }) => {
      await page.getByRole("button", { name: "Open account menu" }).click();
      await page.getByRole("button", { name: "Plan / Upgrade" }).click();

      await expect(page.getByText("Choose your plan")).toBeVisible({ timeout: 8_000 });

      await page.getByRole("button", { name: "Close" }).click();

      await expect(page.getByText("Choose your plan")).not.toBeVisible({ timeout: 5_000 });
    });

    test("upgrade modal closes with Escape key", async ({ page }) => {
      await page.getByRole("button", { name: "Open account menu" }).click();
      await page.getByRole("button", { name: "Plan / Upgrade" }).click();

      await expect(page.getByText("Choose your plan")).toBeVisible({ timeout: 8_000 });

      await page.keyboard.press("Escape");

      await expect(page.getByText("Choose your plan")).not.toBeVisible({ timeout: 5_000 });
    });

    test("subtitle says cancel anytime", async ({ page }) => {
      await page.getByRole("button", { name: "Open account menu" }).click();
      await page.getByRole("button", { name: "Plan / Upgrade" }).click();

      await expect(page.getByText(/cancel anytime/i).first()).toBeVisible({ timeout: 8_000 });
    });
  });
});
