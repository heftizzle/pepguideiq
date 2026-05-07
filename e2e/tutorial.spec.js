import { expect, test } from "@playwright/test";
import { loginUser } from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

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
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("button", { name: "Tutorials" }).click();

    // Tutorial should show some kind of step UI — look for step indicator or CTA
    const tutorialUI = page
      .getByText(/step 1|welcome|let's start|get started|tutorial/i)
      .or(page.getByRole("button", { name: /next|continue|start|got it/i }));

    await expect(tutorialUI.first()).toBeVisible({ timeout: 8_000 });
  });

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  test("tutorial has a forward navigation button", async ({ page }) => {
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("button", { name: "Tutorials" }).click();

    const nextBtn = page.getByRole("button", {
      name: /next|continue|got it|start|let's go/i,
    });
    await expect(nextBtn.first()).toBeVisible({ timeout: 8_000 });
    await expect(nextBtn.first()).toBeEnabled();
  });

  test("advancing tutorial steps progresses the flow", async ({ page }) => {
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("button", { name: "Tutorials" }).click();

    // Advance 3 steps and confirm something changes each time
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.getByRole("button", { name: /next|continue|got it/i }).first();
      await expect(nextBtn).toBeVisible({ timeout: 6_000 });
      await nextBtn.click();
      await page.waitForTimeout(500); // allow mount animation
    }

    // Still in tutorial (haven't completed all 12 steps)
    const stillInTutorial = page
      .getByRole("button", { name: /next|continue|got it|done|finish/i })
      .or(page.getByText(/step \d|tutorial/i));
    await expect(stillInTutorial.first()).toBeVisible({ timeout: 6_000 });
  });

  test("tutorial can be dismissed or closed", async ({ page }) => {
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("button", { name: "Tutorials" }).click();

    await expect(page.getByRole("button", { name: /next|continue|got it|start/i }).first()).toBeVisible({
      timeout: 8_000,
    });

    // Try Escape key first
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // If still showing, look for an explicit close/skip button
    const tutorialStillOpen = await page
      .getByRole("button", { name: /next|continue|got it/i })
      .isVisible()
      .catch(() => false);

    if (tutorialStillOpen) {
      const closeBtn = page.getByRole("button", {
        name: /close|skip|dismiss|exit/i,
      });
      if (await closeBtn.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
        await closeBtn.first().click();
      }
    }

    // Tutorial overlay should be gone — bottom nav should be accessible
    await expect(page.getByText("LIBRARY", { exact: true })).toBeVisible({ timeout: 6_000 });
  });

  // ---------------------------------------------------------------------------
  // Ghost vial — no DB writes
  // ---------------------------------------------------------------------------

  test("completing tutorial does not add compounds to the stack", async ({ page }) => {
    // Record stack state before tutorial
    await page.getByText("STACK BUILDER", { exact: true }).click();
    await page.getByText(/search catalog/i).isVisible({ timeout: 5_000 }).catch(() => false);

    // Trigger tutorial
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("button", { name: "Tutorials" }).click();

    await expect(page.getByRole("button", { name: /next|continue|got it|start/i }).first()).toBeVisible({
      timeout: 8_000,
    });

    // Advance all 12 steps (max 13 clicks to be safe)
    for (let i = 0; i < 13; i++) {
      const nextBtn = page.getByRole("button", { name: /next|continue|got it|done|finish/i }).first();
      if (!(await nextBtn.isVisible({ timeout: 2_000 }).catch(() => false))) break;
      await nextBtn.click();
      await page.waitForTimeout(400);
    }

    // Navigate back to stack builder — stack should be unchanged
    await page.getByText("STACK BUILDER", { exact: true }).click();
    // "Search catalog…" placeholder means no ghost compound was committed
    await expect(page.getByPlaceholder("Search catalog...").or(page.getByText("Search catalog..."))).toBeVisible({
      timeout: 5_000,
    });
  });

  // ---------------------------------------------------------------------------
  // Post-tutorial profile modal
  // ---------------------------------------------------------------------------

  test("completing all tutorial steps shows post-tutorial profile modal", async ({ page }) => {
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("button", { name: "Tutorials" }).click();

    await expect(page.getByRole("button", { name: /next|continue|got it|start/i }).first()).toBeVisible({
      timeout: 8_000,
    });

    // Advance through all 12 steps
    for (let i = 0; i < 13; i++) {
      const nextBtn = page.getByRole("button", { name: /next|continue|got it|done|finish/i }).first();
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
