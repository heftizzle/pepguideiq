import { expect, test } from "@playwright/test";
import {
  dismissTutorialIfPresent,
  passAgeGateIfPresent,
  waitForOverlaysToClear,
} from "../e2e/helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("nav smoke (auth)", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await passAgeGateIfPresent(page);
    await dismissTutorialIfPresent(page);
    await waitForOverlaysToClear(page);
    await page.evaluate(() => {
      try {
        localStorage.setItem("pepv_nav_tips_seen", "true");
      } catch {
        /* ignore */
      }
    });
  });

  test("all five bottom nav tabs render without crashing", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: /library,/i })).toBeVisible();
    await expect(nav.getByRole("button", { name: /^Vial Tracker$/i })).toBeVisible();
    await expect(nav.getByRole("button", { name: /^Stack Builder$/i })).toBeVisible();
    await expect(nav.getByRole("button", { name: /^Stacks$/i })).toBeVisible();
    await expect(nav.getByRole("button", { name: /^Network$/i })).toBeVisible();
  });

  test("each bottom nav tab loads content with no React crash", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => {
      errors.push(err);
    });

    const nav = page.getByRole("navigation", { name: "Main" });
    const boundary = page.getByText("Something went wrong");

    async function assertHealthy() {
      expect(errors, `pageerror: ${errors.map((e) => e.message).join("; ")}`).toHaveLength(0);
      await expect(boundary).toHaveCount(0);
    }

    await nav.getByRole("button", { name: /library,/i }).click();
    await expect(page.getByTestId("compound-card").first()).toBeVisible({ timeout: 15_000 });
    await assertHealthy();

    await nav.getByRole("button", { name: /^Vial Tracker$/i }).click();
    await expect(page.getByText(/VIAL INVENTORY/i).first()).toBeVisible({ timeout: 15_000 });
    await assertHealthy();

    await nav.getByRole("button", { name: /^Stack Builder$/i }).click();
    await expect(page.getByText(/COMPOUND BUILDER/i).first()).toBeVisible({ timeout: 15_000 });
    await assertHealthy();

    await nav.getByRole("button", { name: /^Stacks$/i }).click();
    await expect(page.getByText(/SAVED STACKS/i).first()).toBeVisible({ timeout: 15_000 });
    await assertHealthy();

    await nav.getByRole("button", { name: /^Network$/i }).click();
    await expect(page.getByText(/^NETWORK$/).first()).toBeVisible({ timeout: 15_000 });
    await assertHealthy();
  });

  test("Profile tab opens from account menu without crashing", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => {
      errors.push(err);
    });

    await page.getByRole("button", { name: /open account menu/i }).click();
    await page.getByRole("button", { name: /^Profile$/ }).click();

    await expect(page.locator(".brand").filter({ hasText: /^Profile$/ }).first()).toBeVisible({ timeout: 15_000 });
    expect(errors, `pageerror: ${errors.map((e) => e.message).join("; ")}`).toHaveLength(0);
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });
});
