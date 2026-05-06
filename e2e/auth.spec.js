import { expect, test } from "@playwright/test";
import { loginUser, passAgeGateIfPresent } from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("auth flows", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  test("valid login lands on authenticated view with bottom nav", async ({ page }) => {
    await loginUser(page, process.env.E2E_TEST_EMAIL, process.env.E2E_TEST_PASSWORD);
    await expect(page.getByText("LIBRARY", { exact: true })).toBeVisible();
    await expect(page.getByText("STACK BUILDER", { exact: true })).toBeVisible();
  });

  test("bad password shows an error", async ({ page }) => {
    await page.goto("/");
    await passAgeGateIfPresent(page);
    await page.getByLabel(/email/i).first().fill(process.env.E2E_TEST_EMAIL);
    await page.getByLabel(/password/i).first().fill("wrong-password-xyz");
    await page.getByRole("button", { name: /sign in|log in|continue/i }).last().click();
    await expect(page.getByText(/invalid|incorrect|error|failed/i).first()).toBeVisible({ timeout: 6_000 });
  });
});
