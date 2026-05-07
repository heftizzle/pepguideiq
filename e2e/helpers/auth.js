import { expect } from "@playwright/test";

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

export async function loginUser(page, email, password) {
  await page.goto("/");
  await passAgeGateIfPresent(page);

  // Already logged in
  if (await page.getByText("LIBRARY", { exact: true }).isVisible({ timeout: 2_000 }).catch(() => false)) {
    await dismissTutorialIfPresent(page);
    return;
  }

  // Fill credentials using placeholder selectors (inputs have no labels)
  await page.getByPlaceholder("you@email.com").first().fill(email);
  await page.getByPlaceholder("••••••••").first().fill(password);
  await page.getByRole("button", { name: /sign in|log in|continue/i }).last().click();

  // After login: wait for app to render, then clear tutorial before asserting nav
  await page.waitForTimeout(3_000);
  await dismissTutorialIfPresent(page);
  await expect(page.getByText("LIBRARY", { exact: true })).toBeVisible({ timeout: 15_000 });
}
