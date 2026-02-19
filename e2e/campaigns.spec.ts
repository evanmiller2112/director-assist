import { test, expect } from '@playwright/test';
import { clearIndexedDB, waitForAppReady } from './helpers/db-helpers';

test.describe('Campaign Creation & Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first so IndexedDB exists in the right origin context,
    // then clear it, then reload so the app starts fresh.
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await clearIndexedDB(page);
    await page.reload();
    await waitForAppReady(page);
  });

  test('default campaign is created on first load', async ({ page }) => {
    // After a fresh DB clear and reload the app auto-creates "My Campaign".
    // The sidebar also has an h1 with the campaign name, so scope to <main>.
    await expect(page.locator('main h1')).toContainText('My Campaign', { timeout: 10000 });
  });

  test('create a new campaign and verify it appears', async ({ page }) => {
    await page.goto('/entities/campaign');

    // Two h1s exist (sidebar + page). Target the main content heading specifically.
    await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 10000 });

    // The "Add Campaign" link is an <a> element generated from the entity type label.
    await page.click('a:has-text("Add Campaign")');
    await page.waitForURL(/\/entities\/campaign\/new/);

    await page.fill('#name', 'Test Adventure');

    // Submit button text is "Create" (rendered by LoadingButton).
    await page.click('button:has-text("Create")');

    // Wait for navigation away from /new to the persisted entity page.
    await page.waitForURL((url) => url.pathname.startsWith('/entities/campaign/') && !url.pathname.endsWith('/new'));

    // The sidebar also has an h1, so scope to <main> to be unambiguous.
    await expect(page.locator('main h1')).toContainText('Test Adventure', { timeout: 10000 });
  });
});
