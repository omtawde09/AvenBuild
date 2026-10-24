import { expect, type Page } from '@playwright/test';

export const OWNER = 'Meera Kulkarni';
export const CONTRACTOR = 'Sahyadri Waterproofing & Civil Works';

/** Choose a demo persona via the persona selection page (works on every viewport). */
export async function becomePersona(page: Page, name: typeof OWNER | typeof CONTRACTOR) {
  await page.goto('/start');
  await page.getByRole('button', { name: new RegExp(name.replace(/[&]/g, '\\&')) }).first().click();
  await expect(page).toHaveURL(name === OWNER ? /\/owner$/ : /\/contractor$/);
}

/** Collect console errors and uncaught exceptions for the page. */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

export async function resetDemo(page: Page) {
  await page.goto('/help');
  await page.getByRole('button', { name: 'Reset demo data' }).first().click();
  await page.getByRole('dialog', { name: 'Reset demo data?' }).getByRole('button', { name: 'Reset demo data' }).click();
  await expect(page).toHaveURL(/\/start$/);
}

export async function noHorizontalOverflow(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw, `page is ${sw}px wide in a ${cw}px viewport`).toBeLessThanOrEqual(cw + 1);
}
