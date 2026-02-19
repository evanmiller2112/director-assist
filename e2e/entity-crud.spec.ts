import { test, expect } from '@playwright/test';
import { clearIndexedDB, waitForAppReady } from './helpers/db-helpers';

test.describe('Entity CRUD - NPC', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first so IndexedDB exists in the right origin context,
    // then clear it, then reload so the app starts fresh.
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await clearIndexedDB(page);
    await page.reload();
    await waitForAppReady(page);
  });

  test('create an NPC entity', async ({ page }) => {
    // Navigate to the NPC list via the sidebar link.
    await page.click('a[href="/entities/npc"]');
    await page.waitForURL(/\/entities\/npc/);

    // The add button is an <a> with text matching the entity type label ("NPC").
    await page.click('a:has-text("Add NPC")');
    await page.waitForURL(/\/entities\/npc\/new/);

    await page.fill('#name', 'Bartleby the Innkeeper');

    // Submit button text is "Create" (from LoadingButton).
    await page.click('button:has-text("Create")');

    // Wait for navigation away from /new to the persisted entity page.
    // The regex /\/entities\/npc\/.+/ also matches /new, so we use a predicate instead.
    await page.waitForURL(
      (url) => url.pathname.startsWith('/entities/npc/') && !url.pathname.endsWith('/new')
    );

    await expect(page.getByRole('heading', { name: 'Bartleby the Innkeeper' })).toBeVisible({
      timeout: 10000
    });
  });

  test('view an NPC entity from list', async ({ page }) => {
    // Create the NPC first.
    await page.goto('/entities/npc/new');
    await page.waitForLoadState('networkidle');
    await page.fill('#name', 'Bartleby the Innkeeper');
    await page.click('button:has-text("Create")');

    // Wait for navigation away from /new.
    await page.waitForURL(
      (url) => url.pathname.startsWith('/entities/npc/') && !url.pathname.endsWith('/new')
    );

    // Go to the list and click through to the entity.
    await page.goto('/entities/npc');
    await expect(page.locator('[data-testid="entity-card"]')).toHaveCount(1, { timeout: 10000 });
    await page.click('[data-testid="entity-card"]');
    await page.waitForURL(
      (url) => url.pathname.startsWith('/entities/npc/') && !url.pathname.endsWith('/new')
    );

    // Two h1s exist on the page (sidebar campaign + entity name). Use getByRole to be specific.
    await expect(page.getByRole('heading', { name: 'Bartleby the Innkeeper' })).toBeVisible({
      timeout: 10000
    });
  });

  test('edit an NPC entity', async ({ page }) => {
    // Create the NPC first.
    await page.goto('/entities/npc/new');
    await page.waitForLoadState('networkidle');
    await page.fill('#name', 'Bartleby the Innkeeper');
    await page.click('button:has-text("Create")');

    // Wait for navigation away from /new so we can capture the real view URL.
    await page.waitForURL(
      (url) => url.pathname.startsWith('/entities/npc/') && !url.pathname.endsWith('/new')
    );
    const viewUrl = page.url();

    // Navigate to the edit page via the "Edit" link.
    await page.click('a:has-text("Edit")');
    await page.waitForURL(/\/edit$/);

    // Clear and re-fill the name field.
    await page.fill('#name', '');
    await page.fill('#name', 'Bartleby the Retired Innkeeper');

    // The save button text is "Save Changes".
    await page.click('button:has-text("Save Changes")');
    await page.waitForURL(viewUrl);

    await expect(page.getByRole('heading', { name: 'Bartleby the Retired Innkeeper' })).toBeVisible({
      timeout: 10000
    });
  });

  test('delete an NPC entity', async ({ page }) => {
    // Create the NPC first.
    await page.goto('/entities/npc/new');
    await page.waitForLoadState('networkidle');
    await page.fill('#name', 'Doomed NPC');
    await page.click('button:has-text("Create")');

    // Wait for navigation away from /new.
    await page.waitForURL(
      (url) => url.pathname.startsWith('/entities/npc/') && !url.pathname.endsWith('/new')
    );

    // Accept the browser confirm dialog that the delete handler triggers.
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // The delete button has title="Delete" (when not the last campaign).
    await page.click('button[title="Delete"]');
    await page.waitForURL(/\/entities\/npc$/);
    await expect(page.getByText('Doomed NPC')).not.toBeVisible();
  });
});
