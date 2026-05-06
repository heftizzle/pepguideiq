import { expect, test } from "@playwright/test";
import { passAgeGateIfPresent } from "./helpers/auth.js";

test("landing page loads and shows PepGuideIQ branding", async ({ page }) => {
  await page.goto("/");
  await passAgeGateIfPresent(page);
  await expect(page).toHaveTitle(/pepguide/i);
  await expect(
    page
      .getByRole("heading", { name: /pepguide/i })
      .or(page.getByText("PepGuideIQ"))
      .or(page.getByText("PepGuide"))
      .first()
  ).toBeVisible();
});

test("landing page has a sign-in entry point", async ({ page }) => {
  await page.goto("/");
  await passAgeGateIfPresent(page);
  const libraryNav = page.getByText("LIBRARY", { exact: true });
  if (await libraryNav.isVisible().catch(() => false)) {
    await expect(libraryNav).toBeVisible();
    return;
  }
  const authEntry = page
    .getByRole("button", { name: /sign in|log in|get started/i })
    .or(page.getByTestId("auth-toggle"));
  await expect(authEntry.first()).toBeVisible();
});

test("no JS crash on load", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/");
  await passAgeGateIfPresent(page);
  await page.waitForTimeout(2000);
  expect(errors).toHaveLength(0);
});

test("/pricing route loads", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText(/pro|elite|goat|entry/i).first()).toBeVisible();
});
