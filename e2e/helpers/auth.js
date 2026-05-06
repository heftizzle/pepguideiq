import { expect } from "@playwright/test";

export async function passAgeGateIfPresent(page) {
  const enterButton = page.getByRole("button", { name: /i agree & enter/i });
  if (!(await enterButton.isVisible().catch(() => false))) return;
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await enterButton.click();
}

export async function loginUser(page, email, password) {
  await page.goto("/");
  await passAgeGateIfPresent(page);
  const libraryNav = page.getByText("LIBRARY", { exact: true });
  if (await libraryNav.isVisible().catch(() => false)) {
    await expect(libraryNav).toBeVisible();
    return;
  }

  const emailInput = page.getByLabel(/email/i);
  if (!(await emailInput.first().isVisible().catch(() => false))) {
    const signInTrigger = page
      .getByRole("button", { name: /sign in|log in|get started/i })
      .or(page.getByTestId("auth-toggle"));
    await signInTrigger.first().click();
  }

  await emailInput.first().fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole("button", { name: /sign in|log in|continue/i }).last().click();
  await expect(page.getByText("LIBRARY", { exact: true })).toBeVisible({ timeout: 10_000 });
}
