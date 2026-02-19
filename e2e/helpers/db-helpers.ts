import { type Page } from '@playwright/test';

export async function clearIndexedDB(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs
        .filter((db) => !!db.name)
        .map(
          (db) =>
            new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase(db.name!);
              req.onsuccess = () => resolve();
              req.onerror = () => resolve(); // resolve even on error so we don't hang
              req.onblocked = () => resolve();
            })
        )
    );
  });
}

export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for the sidebar to appear, indicating the app shell has rendered
  await page.waitForSelector('aside', { timeout: 20000 });
  // Then wait for any loading spinners to disappear
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="loading-spinner"]'),
    { timeout: 10000 }
  );
  // Small settling delay to allow Svelte reactive state to stabilise after DB load
  await page.waitForTimeout(300);
}
