import { test, expect } from '@playwright/test';
import { clearIndexedDB, waitForAppReady } from './helpers/db-helpers';

test.describe('Campaign Creation & Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);
    await page.reload();
    await waitForAppReady(page);
  });

  test('default campaign is created on first load', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('My Campaign');
  });

  test('create a new campaign and verify it appears', async ({ page }) => {
    await page.goto('/entities/campaign');
    await expect(page.locator('h1')).toContainText('Campaigns');
    await page.click('a:has-text("Add Campaign")');
    await page.waitForURL(/\/entities\/campaign\/new/);
    await page.fill('#name', 'Test Adventure');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/entities\/campaign\/.+/);
    await expect(page.locator('h1')).toContainText('Test Adventure');
  });
});
