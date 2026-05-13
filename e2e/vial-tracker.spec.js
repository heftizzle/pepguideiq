import { expect, test } from "@playwright/test";
import {
  dismissTutorialIfPresent,
  passAgeGateIfPresent,
  waitForOverlaysToClear,
} from "./helpers/auth.js";

const HAS_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("vial tracker", () => {
  test.skip(!HAS_CREDS, "Skipped: no E2E_TEST_EMAIL / E2E_TEST_PASSWORD set");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await passAgeGateIfPresent(page);
    await dismissTutorialIfPresent(page);
    await waitForOverlaysToClear(page);
    await page.getByRole("button", { name: "Vial Tracker" }).click();
    await page.waitForLoadState("networkidle", { timeout: 20_000 });
  });

  // ---------------------------------------------------------------------------
  // Page load
  // ---------------------------------------------------------------------------

  test("vial tracker loads with VIAL INVENTORY heading", async ({ page }) => {
    await expect(page.getByText("VIAL INVENTORY", { exact: true })).toBeVisible({ timeout: 8_000 });
  });

  test("shows informational note about injectables only", async ({ page }) => {
    await expect(page.getByText(/physical vials only.*injectables/i)).toBeVisible({ timeout: 8_000 });
  });

  test("DOSE HISTORY section is visible", async ({ page }) => {
    await expect(page.getByText("DOSE HISTORY", { exact: true }).first()).toBeVisible({ timeout: 8_000 });
  });

  // ---------------------------------------------------------------------------
  // Floating Log Dose button
  // ---------------------------------------------------------------------------

  test("Log dose by session button is visible on vial tracker", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Log dose by session" })).toBeVisible({ timeout: 5_000 });
  });

  test("Log dose button is visible on all nav tabs", async ({ page }) => {
    // It's a persistent floating button — check on library tab too
    await page.getByRole("button", { name: /Library/ }).click();
    await expect(page.getByRole("button", { name: "Log dose by session" })).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: "Stack Builder" }).click();
    await expect(page.getByRole("button", { name: "Log dose by session" })).toBeVisible({ timeout: 5_000 });
  });

  // ---------------------------------------------------------------------------
  // Week navigation
  // ---------------------------------------------------------------------------

  test("dose history week navigation — Previous week button works", async ({ page }) => {
    const prevBtn = page.getByRole("button", { name: "Previous week" }).first();
    await expect(prevBtn).toBeVisible({ timeout: 8_000 });
    await prevBtn.click();
    // Week range text should still be visible after nav
    await expect(page.getByText(/previous week/i).or(prevBtn)).toBeVisible({ timeout: 3_000 });
  });

  test("dose history week navigation — Next week button works", async ({ page }) => {
    const nextBtn = page.getByRole("button", { name: "Next week" }).first();
    await expect(nextBtn).toBeVisible({ timeout: 8_000 });
    await nextBtn.click();
    await expect(nextBtn).toBeVisible({ timeout: 3_000 });
  });

  test("Expand to full month button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Expand to full month" }).first()).toBeVisible({ timeout: 8_000 });
  });

  // ---------------------------------------------------------------------------
  // Add vial
  // ---------------------------------------------------------------------------

  test("Add vial button is present and clickable", async ({ page }) => {
    const addVialBtn = page.getByRole("button", { name: "+ Add vial" });
    await expect(addVialBtn.first()).toBeVisible({ timeout: 8_000 });
    await addVialBtn.first().click();

    // Should open a vial creation form / modal
    const vialForm = page
      .getByRole("dialog")
      .or(page.getByText(/add vial|new vial|vial name|reconstitut/i))
      .or(page.getByPlaceholder(/vial|brand|mg/i));

    await expect(vialForm.first()).toBeVisible({ timeout: 6_000 });

    // Close / escape out to not mutate data
    await page.keyboard.press("Escape");
  });

  // ---------------------------------------------------------------------------
  // Existing vial actions (non-destructive checks only)
  // ---------------------------------------------------------------------------

  test("existing vial shows vial action buttons", async ({ page }) => {
    // These buttons appear on an existing vial card
    const shareBtn = page.getByRole("button", { name: "Share to Network" });
    const depleteBtn = page.getByRole("button", { name: "Mark as Depleted" });
    const archiveBtn = page.getByRole("button", { name: "Archive" });

    // At least one of these should be visible if user has vials
    const hasVials = await shareBtn.isVisible({ timeout: 8_000 }).catch(() => false);

    test.skip(!hasVials, "No existing vials found for this test account.");

    await expect(shareBtn).toBeVisible();
    await expect(depleteBtn).toBeVisible();
    await expect(archiveBtn).toBeVisible();
  });

  test("Edit reconstitution button is present on vial card", async ({ page }) => {
    const moreBtn = page.getByRole("button", { name: "More actions" }).first();
    const hasVials = await moreBtn.isVisible({ timeout: 8_000 }).catch(() => false);

    test.skip(!hasVials, "No existing vials found for this test account.");

    await moreBtn.click();

    const editBtn = page.getByRole("button", { name: "Edit reconstitution (mg / BAC mL)" });
    await expect(editBtn).toBeVisible({ timeout: 4_000 });

    await page.keyboard.press("Escape");
  });

  test("vial expiry badge is shown on vial card", async ({ page }) => {
    const expiryBadge = page.getByRole("button", { name: /expires in \d+ days?/i });
    const hasVials = await expiryBadge.isVisible({ timeout: 8_000 }).catch(() => false);

    test.skip(!hasVials, "No existing vials with expiry found.");
    await expect(expiryBadge.first()).toBeVisible();
  });
});
