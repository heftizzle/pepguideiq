import { expect, test } from "@playwright/test";
import {
  dismissTutorialIfPresent,
  passAgeGateIfPresent,
  waitForOverlaysToClear,
} from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("catalog (library)", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await passAgeGateIfPresent(page);
    await dismissTutorialIfPresent(page);
    await waitForOverlaysToClear(page);
    await page.getByRole("button", { name: /^Library,/ }).click();
  });

  test("catalog renders compound cards", async ({ page }) => {
    await expect(page.getByTestId("compound-card").first()).toBeVisible({ timeout: 8_000 });
  });

  test("search filters the compound list", async ({ page }) => {
    // Click the search icon to open the search input
    await page.getByRole("button", { name: /open library search/i }).click();

    // Wait for search input to appear — placeholder is "Search by name, alias, tag…"
    const searchInput = page.getByPlaceholder(/search by name/i).first();
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill("BPC");
    await expect(page.getByText(/BPC/i).first()).toBeVisible();
  });

  test("clicking a compound card opens detail view", async ({ page }) => {
    await page.getByTestId("compound-card").first().click();
    await expect(page.getByTestId("compound-detail").or(page.getByRole("dialog")).first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
