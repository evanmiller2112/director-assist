import { type Page } from '@playwright/test';

export async function clearIndexedDB(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });
}

export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector('aside', { timeout: 15000 });
}
