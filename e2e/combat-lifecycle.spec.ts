import { test, expect } from '@playwright/test';
import { clearIndexedDB, waitForAppReady } from './helpers/db-helpers';

test.describe('Combat Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);
    await page.reload();
    await waitForAppReady(page);
  });

  test('full combat lifecycle: create, add combatants, start, advance, end', async ({ page }) => {
    // Create combat session
    await page.goto('/combat');
    await page.click('a:has-text("New Combat")');
    await page.waitForURL(/\/combat\/new/);
    await page.fill('#name', 'Dragon Encounter');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/combat\/.+/);
    expect(page.url()).not.toContain('/new');
    await expect(page.locator('h1')).toContainText('Dragon Encounter');

    // Add first combatant via Quick Add
    await page.click('button:has-text("Add Combatant")');
    // Look for Quick Add tab/button and click it
    const quickAddBtn = page.locator('button:has-text("Quick Add")');
    if (await quickAddBtn.isVisible()) {
      await quickAddBtn.click();
    }
    await page.fill('input[placeholder*="name" i], #quick-name, input[name="name"]', 'Valara the Brave');
    // Fill HP
    const hpInput = page.locator('input[placeholder*="hp" i], #quick-hp, input[name="hp"]');
    if (await hpInput.isVisible()) {
      await hpInput.fill('30');
    }
    // Click Add button in modal
    await page.locator('button:has-text("Add"):not(:has-text("Add Combatant"))').last().click();

    // Add second combatant
    await page.click('button:has-text("Add Combatant")');
    const quickAddBtn2 = page.locator('button:has-text("Quick Add")');
    if (await quickAddBtn2.isVisible()) {
      await quickAddBtn2.click();
    }
    await page.fill('input[placeholder*="name" i], #quick-name, input[name="name"]', 'Young Dragon');
    const hpInput2 = page.locator('input[placeholder*="hp" i], #quick-hp, input[name="hp"]');
    if (await hpInput2.isVisible()) {
      await hpInput2.fill('50');
    }
    await page.locator('button:has-text("Add"):not(:has-text("Add Combatant"))').last().click();

    // Verify combatants
    await expect(page.locator('[data-testid="combatant-card"]')).toHaveCount(2);

    // Start combat
    await page.click('button:has-text("Start Combat")');
    await expect(page.getByText('Round 1')).toBeVisible();

    // Advance turns
    await page.click('button:has-text("Next Turn")');
    await page.click('button:has-text("Next Turn")');
    await expect(page.getByText('Round 2')).toBeVisible();

    // End combat
    await page.click('button:has-text("End Combat")');
    await expect(page.getByText('Completed')).toBeVisible();
  });
});
