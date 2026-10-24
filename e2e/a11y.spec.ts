import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { CONTRACTOR, OWNER, becomePersona, resetDemo } from './helpers';

const OWNER_PAGES = ['/owner', '/owner/projects', '/owner/projects/new', '/owner/projects/prj_seed_terrace/quotes/qt_seed_terrace_sahyadri', '/owner/projects/prj_seed_terrace/compare', '/owner/contractors', '/owner/contractors/usr_ctr_sahyadri', '/owner/settings', '/workspace/ws_seed_bathroom', '/workspace/ws_seed_bathroom/milestones', '/messages/cnv_seed_bathroom', '/notifications'];
const CONTRACTOR_PAGES = ['/contractor', '/contractor/leads', '/contractor/leads/prj_seed_terrace_garden', '/contractor/leads/prj_seed_basement/quote', '/contractor/quotes', '/contractor/profile', '/contractor/portfolio', '/contractor/settings', '/workspace/ws_seed_bathroom/changes'];

async function axe(page: import('@playwright/test').Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${route}: ${v.id} (${v.impact}) — ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
}

test.describe('accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetDemo(page);
  });

  test('no serious or critical axe violations on public, owner and contractor pages', async ({ page }) => {
    const problems: string[] = [];
    for (const r of ['/', '/start', '/help']) problems.push(...(await axe(page, r)));
    await becomePersona(page, OWNER);
    for (const r of OWNER_PAGES) problems.push(...(await axe(page, r)));
    await becomePersona(page, CONTRACTOR);
    for (const r of CONTRACTOR_PAGES) problems.push(...(await axe(page, r)));
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('keyboard: skip link first, visible focus, dialogs trap and restore focus', async ({ page }) => {
    await becomePersona(page, OWNER);
    await page.goto('/owner');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();

    const trigger = page.getByRole('button', { name: 'Switch persona' });
    await trigger.focus();
    const outline = await trigger.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Switch demo persona' });
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      // Focus stays in the dialog, or moves to the browser's own UI (activeElement = body) — never to the page behind.
      const ok = await dialog.evaluate((d) => d.contains(document.activeElement) || document.activeElement === document.body);
      expect(ok).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('every page has exactly one h1 and statuses are written as text', async ({ page }) => {
    await becomePersona(page, OWNER);
    for (const r of ['/owner', '/owner/projects', '/owner/projects/prj_seed_terrace', '/notifications', '/workspace/ws_seed_bathroom']) {
      await page.goto(r);
      await expect(page.locator('h1'), r).toHaveCount(1);
    }
    await page.goto('/owner/projects');
    await expect(page.locator('ul li').getByText('Reviewing quotes', { exact: true }).first()).toBeVisible();
  });

  test('reduced motion disables transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await becomePersona(page, OWNER);
    const duration = await page.getByRole('link', { name: 'Post a project' }).first().evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(duration)).toBeLessThan(0.001);
  });
});
