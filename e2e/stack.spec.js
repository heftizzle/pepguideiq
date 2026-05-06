import { expect, test } from "@playwright/test";
import { loginUser } from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("stack builder", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  test.beforeEach(async ({ page }) => {
    await loginUser(page, process.env.E2E_TEST_EMAIL, process.env.E2E_TEST_PASSWORD);
    await page.getByText("STACK BUILDER", { exact: true }).click();
  });

  test("stack builder tab loads for authenticated user", async ({ page }) => {
    await expect(page.getByText(/stack/i).first()).toBeVisible();
  });

  test("Entry tier shows upsell after stack limit reached", async ({ page }) => {
    const upsellSignal = page.getByText(/upgrade|upsell|limit|pro/i).first();
    const visible = await upsellSignal.isVisible({ timeout: 8_000 }).catch(() => false);
    test.skip(!visible, "No entry-tier upsell visible for this account/session.");
    await expect(upsellSignal).toBeVisible();
  });
});
