import { expect, test } from '@playwright/test';
import { CONTRACTOR, OWNER, becomePersona, resetDemo } from './helpers';

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440];

const PUBLIC = ['/', '/start', '/help'];
const OWNER_ROUTES = [
  '/owner',
  '/owner/projects',
  '/owner/projects/new',
  '/owner/projects/prj_seed_terrace',
  '/owner/projects/prj_seed_terrace/quotes',
  '/owner/projects/prj_seed_terrace/quotes/qt_seed_terrace_sahyadri',
  '/owner/projects/prj_seed_terrace/compare',
  '/owner/contractors',
  '/owner/contractors/usr_ctr_sahyadri',
  '/owner/shortlist',
  '/owner/settings',
  '/workspace/ws_seed_bathroom',
  '/workspace/ws_seed_bathroom/milestones',
  '/workspace/ws_seed_bathroom/updates',
  '/workspace/ws_seed_bathroom/changes',
  '/workspace/ws_seed_bathroom/activity',
  '/messages',
  '/messages/cnv_seed_bathroom',
  '/notifications',
];
const CONTRACTOR_ROUTES = [
  '/contractor',
  '/contractor/leads',
  '/contractor/leads/prj_seed_terrace_garden',
  '/contractor/leads/prj_seed_basement/quote',
  '/contractor/quotes',
  '/contractor/quotes/qt_seed_terrace_sahyadri',
  '/contractor/profile',
  '/contractor/portfolio',
  '/contractor/settings',
  '/workspace/ws_seed_bathroom/documents',
];

async function overflowAt(page: import('@playwright/test').Page, routes: string[], width: number) {
  const problems: string[] = [];
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const r = await page.evaluate(() => {
      const cw = document.documentElement.clientWidth;
      const offenders = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.right <= cw + 1) return false;
          // Elements inside their own horizontal scroller (tab bars, wide tables) are allowed.
          for (let p = el.parentElement; p; p = p.parentElement) {
            const ox = getComputedStyle(p).overflowX;
            if ((ox === 'auto' || ox === 'scroll' || ox === 'hidden') && p.getBoundingClientRect().right <= cw + 1) return false;
          }
          return true;
        })
        .slice(0, 3)
        .map((el) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).slice(0, 60)}`);
      return { sw: document.documentElement.scrollWidth, cw, offenders };
    });
    if (r.sw > r.cw + 1 || r.offenders.length) problems.push(`${route} @${width}px: page ${r.sw}/${r.cw} ${r.offenders.join(', ')}`);
  }
  return problems;
}

test.describe('responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetDemo(page);
  });

  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const problems = [...(await overflowAt(page, PUBLIC, width))];
      await becomePersona(page, OWNER);
      problems.push(...(await overflowAt(page, OWNER_ROUTES, width)));
      await becomePersona(page, CONTRACTOR);
      problems.push(...(await overflowAt(page, CONTRACTOR_ROUTES, width)));
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }

  test('mobile navigation targets are at least 44px and the bottom bar does not cover sticky form actions', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await becomePersona(page, OWNER);
    const nav = page.getByRole('navigation', { name: 'Primary' }).last();
    const boxes = await nav.locator('a, button').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height })));
    for (const b of boxes) {
      expect(b.h).toBeGreaterThanOrEqual(44);
      expect(b.w).toBeGreaterThanOrEqual(44);
    }
    // Focus flows hide the bottom bar so sticky actions are reachable.
    await page.goto('/owner/projects/new');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Next' })).toBeInViewport();
  });

  test('desktop shows the sidebar; phones show the bottom bar', async ({ page }) => {
    await becomePersona(page, CONTRACTOR);
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeVisible();
    await page.setViewportSize({ width: 375, height: 800 });
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'More' })).toBeVisible();
  });
});
