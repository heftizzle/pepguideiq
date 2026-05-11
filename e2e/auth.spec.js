import { expect, test } from "@playwright/test";
import { loginUser, passAgeGateIfPresent, postLoginNavLandmark } from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("auth flows", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  test("valid login lands on authenticated view with bottom nav", async ({ page }) => {
    await loginUser(page, process.env.E2E_TEST_EMAIL, process.env.E2E_TEST_PASSWORD);
    await expect(postLoginNavLandmark(page)).toBeVisible();
    await expect(page.getByRole("button", { name: /stack builder/i })).toBeVisible();
  });

  test("bad password shows an error", async ({ page }) => {
    await page.goto("/");
    await passAgeGateIfPresent(page);
    await page.getByPlaceholder("you@email.com").first().fill(process.env.E2E_TEST_EMAIL);
    await page.getByPlaceholder("••••••••").first().fill("wrong-password-xyz");
    await page.getByRole("button", { name: /sign in|log in|continue/i }).last().click();
    await expect(page.getByText(/invalid|incorrect|error|failed/i).first()).toBeVisible({ timeout: 6_000 });
  });
});
