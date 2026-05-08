import { expect, test } from "@playwright/test";
import { loginUser } from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("catalog (library)", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  test.beforeEach(async ({ page }) => {
    await loginUser(page, process.env.E2E_TEST_EMAIL, process.env.E2E_TEST_PASSWORD);
    await page.getByRole("button", { name: /library/i }).click();
  });

  test("catalog renders compound cards", async ({ page }) => {
    await expect(page.getByTestId("compound-card").first()).toBeVisible({ timeout: 8_000 });
  });

  test("search filters the compound list", async ({ page }) => {
    const openSearchButton = page.getByRole("button", { name: /open library search/i });
    if (await openSearchButton.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await openSearchButton.click();
    }

    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole("searchbox"))
      .first();
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
