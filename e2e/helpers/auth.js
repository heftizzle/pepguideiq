import { expect } from "@playwright/test";

/** Bottom nav first tab (Library) — stable vs visible label text (`App.jsx` `nav[aria-label="Main"]`). */
export function postLoginNavLandmark(page) {
  return page.getByRole("navigation", { name: "Main" }).getByRole("button").first();
}

export async function requireAuth(_page) {
  // no-op: storageState provides session for chromium project
}

export async function passAgeGateIfPresent(page) {
  await page.waitForLoadState("networkidle");
  const enterButton = page.getByRole("button", { name: /i agree & enter/i });
  if (!(await enterButton.isVisible({ timeout: 3_000 }).catch(() => false))) return;
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await enterButton.click();
  await enterButton.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
}

export async function dismissTutorialIfPresent(page) {
  // The blocker is the HamburgerMenu backdrop: div[role="presentation"]
  // It has onClick={() => setOpen(false)} — clicking it closes the menu/overlay
  const backdrop = page.locator('div[role="presentation"]').first();
  if (!(await backdrop.isVisible({ timeout: 3_000 }).catch(() => false))) return;
  await backdrop.click({ force: true });
  await backdrop.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
}

export async function waitForOverlaysToClear(page) {
  await page
    .locator('[style*="tutorialPulse"]')
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

/**
 * Fresh profiles with no `handle` render `HandleSetup` only — no `nav[aria-label="Main"]` yet
 * (see App.jsx `needsHandleOnboarding`). Complete it so post-login landmarks exist.
 */
async function completeHandleOnboardingIfPresent(page) {
  const handleHeading = page.getByText("CHOOSE YOUR HANDLE", { exact: true });
  if (!(await handleHeading.isVisible({ timeout: 4_000 }).catch(() => false))) return;
  const unique = `e2e${Date.now()}`;
  await page.getByPlaceholder("yourhandle").fill(unique);
  await expect(page.getByText("Available", { exact: true })).toBeVisible({ timeout: 25_000 });
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(handleHeading).toBeHidden({ timeout: 30_000 });
}

export async function loginUser(page, email, password) {
  await page.goto("/");
  await passAgeGateIfPresent(page);

  const navLandmark = postLoginNavLandmark(page);

  // Already logged in
  if (await navLandmark.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await dismissTutorialIfPresent(page);
    await waitForOverlaysToClear(page);
    return;
  }

  // Fill credentials using placeholder selectors (inputs have no labels)
  await page.getByPlaceholder("you@email.com").first().fill(email);
  await page.getByPlaceholder("••••••••").first().fill(password);
  await page.getByRole("button", { name: /sign in|log in|continue/i }).last().click();

  // After login: wait for app to render, then clear tutorial before asserting nav
  await page.waitForTimeout(3_000);
  await dismissTutorialIfPresent(page);
  await completeHandleOnboardingIfPresent(page);
  await expect(navLandmark).toBeVisible({ timeout: 15_000 });
  await waitForOverlaysToClear(page);
}
