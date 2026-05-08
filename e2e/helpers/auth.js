import { expect } from "@playwright/test";

const NAV_TIPS_STORAGE_KEY = "pepv_nav_tips_seen";
const PENDING_CORE_TUTORIAL_KEY = "pepv_pending_core_tutorial";

export function getEmailInput(page) {
  return page.getByPlaceholder("you@email.com").or(page.locator('input[type="email"]')).first();
}

export function getPasswordInput(page) {
  return page
    .locator('input[autocomplete="current-password"], input[type="password"], input[placeholder="••••••••"]')
    .first();
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

export async function dismissTutorialBarIfPresent(page) {
  const dismissButton = page.getByRole("button", { name: /dismiss tutorial bar/i });
  if (!(await dismissButton.isVisible({ timeout: 1_500 }).catch(() => false))) return;
  await dismissButton.click();
  await dismissButton.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
}

export async function suppressFirstRunOverlays(page) {
  await page.addInitScript(
    ({ navTipsKey, pendingTutorialKey }) => {
      try {
        window.localStorage.setItem(navTipsKey, "true");
      } catch {
        /* ignore storage failures in tests */
      }
      try {
        window.sessionStorage.removeItem(pendingTutorialKey);
      } catch {
        /* ignore storage failures in tests */
      }
    },
    {
      navTipsKey: NAV_TIPS_STORAGE_KEY,
      pendingTutorialKey: PENDING_CORE_TUTORIAL_KEY,
    }
  );
}

export async function loginUser(page, email, password) {
  await suppressFirstRunOverlays(page);
  await page.goto("/");
  await passAgeGateIfPresent(page);
  const libraryNav = page.getByText("LIBRARY", { exact: true });
  if (await libraryNav.isVisible().catch(() => false)) {
    await dismissTutorialBarIfPresent(page);
    await expect(libraryNav).toBeVisible();
    return;
  }

  const emailInput = getEmailInput(page);
  const emailVisible = await emailInput.isVisible().catch(() => false);
  if (!emailVisible) {
    const signInTrigger = page
      .getByRole("button", { name: /sign in|log in|get started/i })
      .or(page.getByTestId("auth-toggle"));
    await signInTrigger.first().click();
  }

  await expect(emailInput).toBeVisible({ timeout: 5_000 });
  await emailInput.fill(email);
  const passwordInput = getPasswordInput(page);
  await expect(passwordInput).toBeVisible({ timeout: 5_000 });
  await passwordInput.fill(password);
  const submitButton = page.getByRole("button", { name: /sign in|log in|continue/i }).last();
  await expect(submitButton).toBeEnabled({ timeout: 5_000 });
  await submitButton.click();
  await expect(page.getByText("LIBRARY", { exact: true })).toBeVisible({ timeout: 10_000 });
  await dismissTutorialBarIfPresent(page);
}
