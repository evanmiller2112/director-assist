import { test, expect } from '@playwright/test';
import { clearIndexedDB, waitForAppReady } from './helpers/db-helpers';

test.describe('Combat Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first so IndexedDB exists in the right origin context,
    // then clear it, then reload so the app starts fresh.
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await clearIndexedDB(page);
    await page.reload();
    await waitForAppReady(page);
  });

  test('full combat lifecycle: create, add combatants, start, advance, end', async ({ page }) => {
    // ------------------------------------------------------------------ Create combat session
    await page.goto('/combat');

    // "New Combat" is a <button> element (not an <a> tag) on the combat list page.
    // When there are no sessions it appears in the empty-state section.
    await page.click('button:has-text("New Combat")');
    await page.waitForURL(/\/combat\/new/);

    // The form field id is "combat-name" (not "name").
    await page.fill('#combat-name', 'Dragon Encounter');

    // The submit button text is "Create Combat".
    await page.click('button:has-text("Create Combat")');

    // Wait for navigation away from /new. The regex /\/combat\/.+/ also matches /new,
    // so we use a URL predicate to ensure we land on the actual combat page.
    await page.waitForURL(
      (url) => url.pathname.startsWith('/combat/') && !url.pathname.endsWith('/new')
    );

    // Scope to <main> to avoid the sidebar h1 that shows the campaign name.
    await expect(page.locator('main h1')).toContainText('Dragon Encounter', { timeout: 10000 });

    // ------------------------------------------------------------------ Add first combatant (Quick Add)
    await page.click('button:has-text("Add Combatant")');

    // The modal opens in "From Entity" mode by default. Switch to Quick Add.
    await page.click('button:has-text("Quick Add")');

    // Quick-add name field has id="quick-name".
    await page.fill('#quick-name', 'Valara the Brave');

    // Quick-add HP field has id="quick-hp".
    await page.fill('#quick-hp', '30');

    // Click the footer "Add" button (exact text match to avoid matching "Quick Add").
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Add', exact: true }).click();

    // ------------------------------------------------------------------ Add second combatant (Quick Add)
    // Wait for the modal to close before reopening it.
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    await page.click('button:has-text("Add Combatant")');
    await page.click('button:has-text("Quick Add")');
    await page.fill('#quick-name', 'Young Dragon');
    await page.fill('#quick-hp', '50');
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for the modal to close.
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // ------------------------------------------------------------------ Verify combatants
    await expect(page.locator('[data-testid="combatant-card"]')).toHaveCount(2, { timeout: 10000 });

    // ------------------------------------------------------------------ Start combat
    await page.click('button:has-text("Start Combat")');

    // "Round 1" appears in both the initiative tracker and TurnControls; .first() avoids
    // strict mode violation while still verifying the text is on screen.
    await expect(page.getByText('Round 1').first()).toBeVisible({ timeout: 10000 });

    // ------------------------------------------------------------------ Advance turns
    // With 2 combatants, clicking Next Turn twice advances to Round 2.
    await page.click('button:has-text("Next Turn")');
    await page.click('button:has-text("Next Turn")');
    await expect(page.getByText('Round 2').first()).toBeVisible({ timeout: 10000 });

    // ------------------------------------------------------------------ End combat
    await page.click('button:has-text("End Combat")');

    // After endCombat the store clears activeCombat and the detail page shows
    // "Combat not found". Wait for that transition to confirm the action completed,
    // then navigate to the list page to verify the "Completed" badge.
    await expect(page.getByText('Combat not found')).toBeVisible({ timeout: 10000 });

    await page.goto('/combat');
    await expect(page.locator('[data-testid="status-badge"]:has-text("Completed")').first()).toBeVisible({
      timeout: 10000
    });
  });
});
