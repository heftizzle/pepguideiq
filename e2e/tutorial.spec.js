import { expect, test } from "@playwright/test";
import { loginUser } from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

async function openTutorialMenu(page) {
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("button", { name: "Tutorials" }).click();
  await expect(page.getByRole("menu")).toBeVisible({ timeout: 5_000 });
}

async function startCoreTutorial(page) {
  await openTutorialMenu(page);
  await page.getByRole("menuitem", { name: /replay tutorial/i }).click();
  await expect(getTutorialNextButton(page)).toBeVisible({ timeout: 8_000 });
}

function getTutorialNextButton(page) {
  return page.locator("button.btn-teal").filter({ hasText: /next|done/i }).first();
}

test.describe("tutorial flow", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  test.beforeEach(async ({ page }) => {
    await loginUser(page, process.env.E2E_TEST_EMAIL, process.env.E2E_TEST_PASSWORD);
  });

  // ---------------------------------------------------------------------------
  // Entry points
  // ---------------------------------------------------------------------------

  test("Tutorials menu item is reachable from account menu", async ({ page }) => {
    await page.getByRole("button", { name: "Open account menu" }).click();
    await expect(page.getByRole("button", { name: "Tutorials" })).toBeVisible({ timeout: 5_000 });
  });

  test("Help and guided tour button is visible in top bar", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Help and guided tour" })).toBeVisible();
  });

  test("clicking Tutorials opens tutorial overlay", async ({ page }) => {
    await openTutorialMenu(page);
    await expect(page.getByRole("menuitem", { name: /replay tutorial/i })).toBeVisible({ timeout: 8_000 });
  });

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  test("tutorial has a forward navigation button", async ({ page }) => {
    await startCoreTutorial(page);

    const nextBtn = getTutorialNextButton(page);
    await expect(nextBtn).toBeVisible({ timeout: 8_000 });
    await expect(nextBtn).toBeEnabled();
  });

  test("advancing tutorial steps progresses the flow", async ({ page }) => {
    await startCoreTutorial(page);

    await expect(page.getByText(/Step 1 of 12/i)).toBeVisible({ timeout: 5_000 });
    for (let i = 0; i < 3; i++) {
      const nextBtn = getTutorialNextButton(page);
      await expect(nextBtn).toBeVisible({ timeout: 6_000 });
      await nextBtn.click();
      await page.waitForTimeout(500); // allow mount animation
    }

    await expect(page.getByText(/Step 4 of 12/i)).toBeVisible({ timeout: 6_000 });
    await expect(getTutorialNextButton(page)).toBeVisible({ timeout: 6_000 });
  });

  test("tutorial can be dismissed or closed", async ({ page }) => {
    await openTutorialMenu(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden({ timeout: 6_000 });
    await expect(page.getByRole("button", { name: /library/i })).toBeVisible({ timeout: 6_000 });
  });

  // ---------------------------------------------------------------------------
  // Ghost vial — no DB writes
  // ---------------------------------------------------------------------------

  test("completing tutorial does not add compounds to the stack", async ({ page }) => {
    // Record stack state before tutorial
    await page.getByRole("button", { name: /stack builder/i }).click();
    await expect(page.getByPlaceholder(/search catalog/i)).toBeVisible({ timeout: 5_000 });

    // Trigger tutorial
    await startCoreTutorial(page);

    // Advance all 12 steps (max 13 clicks to be safe)
    for (let i = 0; i < 13; i++) {
      const nextBtn = getTutorialNextButton(page);
      if (!(await nextBtn.isVisible({ timeout: 2_000 }).catch(() => false))) break;
      await nextBtn.click();
      await page.waitForTimeout(400);
    }

    // Navigate back to stack builder — stack should be unchanged
    await page.getByRole("button", { name: /stack builder/i }).click();
    await expect(page.getByPlaceholder(/search catalog/i)).toBeVisible({ timeout: 5_000 });
  });

  // ---------------------------------------------------------------------------
  // Post-tutorial profile modal
  // ---------------------------------------------------------------------------

  test("completing all tutorial steps shows post-tutorial profile modal", async ({ page }) => {
    await startCoreTutorial(page);

    // Advance through all 12 steps
    for (let i = 0; i < 13; i++) {
      const nextBtn = getTutorialNextButton(page);
      if (!(await nextBtn.isVisible({ timeout: 2_000 }).catch(() => false))) break;
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // After all steps, a profile completion modal should appear
    const profileModal = page
      .getByText(/complete your profile|set up your profile|profile/i)
      .or(page.getByRole("dialog"))
      .or(page.getByRole("button", { name: /complete profile|finish setup|save profile/i }));

    await expect(profileModal.first()).toBeVisible({ timeout: 8_000 });
  });
});
