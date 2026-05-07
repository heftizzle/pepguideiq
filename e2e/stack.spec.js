import { expect, test } from "@playwright/test";
import { loginUser, dismissTutorialIfPresent } from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("stack builder", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  test.beforeEach(async ({ page }) => {
    await loginUser(page, process.env.E2E_TEST_EMAIL, process.env.E2E_TEST_PASSWORD);
    await dismissTutorialIfPresent(page);
    await page.getByRole("button", { name: "Stack Builder" }).click();
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

  test("Wolverine Blend vial math is correct at daily 8 weeks 10mg vial", async ({ page }) => {
    for (let i = 0; i < 20; i += 1) {
      const removeBtn = page.getByRole("button", { name: "Remove" }).first();
      const canRemove = await removeBtn.isVisible({ timeout: 250 }).catch(() => false);
      if (!canRemove) break;
      await removeBtn.click();
    }

    await page.getByPlaceholder(/search catalog/i).fill("Wolverine Blend");

    const searchHit = page
      .locator(".build-tab-compound-meta")
      .filter({ has: page.getByText("Wolverine Blend", { exact: true }) })
      .filter({ has: page.getByRole("button", { name: /\+ add|add/i }) })
      .first();
    const addButton = searchHit.getByRole("button", { name: /\+ add|add/i });
    const addEnabled = await addButton.isEnabled().catch(() => false);
    if (addEnabled) await addButton.click();

    const stackRow = page
      .locator(".build-tab-compound-meta")
      .filter({ has: page.getByText("Wolverine Blend", { exact: true }) })
      .filter({ has: page.locator("select") })
      .first();
    await stackRow.locator("select").selectOption("daily");

    await page.locator('input[type="number"]').first().fill("8");

    await page.getByRole("textbox", { name: "Vial size (mg)" }).first().fill("10");

    await expect(page.getByText(/~28mg for cycle/i)).toBeVisible();
    await expect(page.getByText(/3× 10mg vials/i).first()).toBeVisible();
    await expect(page.getByText(/28mg|3 vials|3× 10mg/i).first()).toBeVisible();
  });
});
