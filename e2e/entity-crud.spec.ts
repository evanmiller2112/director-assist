import { test, expect } from '@playwright/test';
import { clearIndexedDB, waitForAppReady } from './helpers/db-helpers';

test.describe('Entity CRUD - NPC', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);
    await page.reload();
    await waitForAppReady(page);
  });

  test('create an NPC entity', async ({ page }) => {
    await page.click('a[href="/entities/npc"]');
    await page.waitForURL(/\/entities\/npc/);
    await page.click('a:has-text("Add NPC")');
    await page.waitForURL(/\/entities\/npc\/new/);
    await page.fill('#name', 'Bartleby the Innkeeper');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/entities\/npc\/.+/);
    expect(page.url()).not.toContain('/new');
    await expect(page.locator('h1')).toContainText('Bartleby the Innkeeper');
  });

  test('view an NPC entity from list', async ({ page }) => {
    await page.goto('/entities/npc/new');
    await page.fill('#name', 'Bartleby the Innkeeper');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/entities\/npc\/.+/);
    await page.goto('/entities/npc');
    await expect(page.locator('[data-testid="entity-card"]')).toHaveCount(1);
    await page.click('[data-testid="entity-card"]');
    await page.waitForURL(/\/entities\/npc\/.+/);
    await expect(page.locator('h1')).toContainText('Bartleby the Innkeeper');
  });

  test('edit an NPC entity', async ({ page }) => {
    await page.goto('/entities/npc/new');
    await page.fill('#name', 'Bartleby the Innkeeper');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/entities\/npc\/.+/);
    const viewUrl = page.url();
    await page.click('a:has-text("Edit")');
    await page.waitForURL(/\/edit$/);
    await page.fill('#name', 'Bartleby the Retired Innkeeper');
    await page.click('button:has-text("Save")');
    await page.waitForURL(viewUrl);
    await expect(page.locator('h1')).toContainText('Bartleby the Retired Innkeeper');
  });

  test('delete an NPC entity', async ({ page }) => {
    await page.goto('/entities/npc/new');
    await page.fill('#name', 'Doomed NPC');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/entities\/npc\/.+/);
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.click('button:has(svg.lucide-trash-2)');
    await page.waitForURL(/\/entities\/npc$/);
    await expect(page.getByText('Doomed NPC')).not.toBeVisible();
  });
});
