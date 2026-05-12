import { expect } from "@playwright/test";

export function postLoginNavLandmark(page) {
  return page.getByRole("navigation", { name: "Main" }).getByRole("button").first();
}

export async function requireAuth(_page) {}

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
  // Press Escape to dismiss tutorial overlay and/or hamburger drawer.
  // The old code targeted div[role="presentation"] (hamburger backdrop) which
  // never dismissed the tutorial — Step 1 of 12 was left blocking all nav clicks.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  // If tutorial "Next" button is still visible, try clicking a skip/close control.
  const nextBtn = page.getByRole("button", { name: /next/i }).first();
  const tutorialActive = await nextBtn.isVisible({ timeout: 1_000 }).catch(() => false);
  if (tutorialActive) {
    // Try Escape again — some tutorial steps need two presses
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }
}

export async function waitForOverlaysToClear(page) {
  // 1. Wait for tutorial spotlight pulse ring to clear
  await page
    .locator('[style*="tutorialPulse"]')
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});

  // 2. Close hamburger drawer only when actually open (data-open="true")
  const hamburgerBackdrop = page.locator('.pepv-hamburger-overlay[data-open="true"]');
  const isOpen = await hamburgerBackdrop.isVisible().catch(() => false);
  if (isOpen) {
    await hamburgerBackdrop.click().catch(() => {});
    await hamburgerBackdrop
      .waitFor({ state: "hidden", timeout: 3000 })
      .catch(() => {});
  }
}

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

  if (await navLandmark.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await dismissTutorialIfPresent(page);
    await waitForOverlaysToClear(page);
    return;
  }

  await page.getByPlaceholder("you@email.com").first().fill(email);
  await page.getByPlaceholder("••••••••").first().fill(password);
  await page.getByRole("button", { name: /sign in|log in|continue/i }).last().click();

  await page.waitForTimeout(3_000);
  await dismissTutorialIfPresent(page);
  await completeHandleOnboardingIfPresent(page);
  await expect(navLandmark).toBeVisible({ timeout: 15_000 });
  await waitForOverlaysToClear(page);
}
