import { expect, test, type Page } from '@playwright/test';
import { CONTRACTOR, OWNER, becomePersona, noHorizontalOverflow, resetDemo, trackConsoleErrors } from './helpers';

/**
 * Acceptance scenarios H1–H8 from docs/acceptance-checklist.md, run in order on a phone-sized viewport
 * from a reset seed. They share one browser page so local demo state carries from step to step.
 */
test.describe.configure({ mode: 'serial' });

const TITLE = 'E2E bathroom waterproofing before retiling';
let page: Page;
let errors: string[];
let quoteUrl = '';
let workspaceUrl = '';

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  errors = trackConsoleErrors(page);
  await page.goto('/');
  await resetDemo(page);
});

test.afterAll(async () => {
  await page.close();
});

test('H1 owner drafts, refreshes, resumes and publishes; project reaches the contractor feed', async () => {
  await page.goto('/');
  await noHorizontalOverflow(page);
  await page.getByRole('link', { name: /Post a project/ }).click();
  await page.getByRole('button', { name: new RegExp(OWNER) }).click();
  await expect(page).toHaveURL(/\/owner$/);

  await page.goto('/owner/projects/new');
  await page.getByRole('radio', { name: /^Waterproofing/ }).check();
  await page.getByLabel('Project title').fill(TITLE);
  await page.getByLabel('Property type').selectOption('apartment');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(/\/edit\?step=1/);
  await page.getByLabel('Describe the work').fill('Waterproof the floor and shower walls of a 6 x 8 ft bathroom before new tiles go in. Old tiles already removed.');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Location' })).toBeVisible();

  // Refresh mid-draft and resume where we left off.
  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: 'Location' })).toBeVisible();
  await page.getByLabel('City').selectOption('Pune');
  await page.getByLabel('Locality / area').fill('Kothrud');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Minimum (₹)').fill('50000');
  await page.getByLabel('Maximum (₹)').fill('80000');
  await page.getByRole('radio', { name: 'As soon as possible' }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByText('Sat', { exact: true }).click();
  await page.getByLabel('Visiting hours').fill('10 am - 1 pm');
  await page.getByRole('radio', { name: 'Contractor supplies materials' }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Review' })).toBeVisible();
  await expect(page.getByText(TITLE)).toBeVisible();
  await page.getByRole('button', { name: 'Publish project' }).click();
  await page.getByRole('dialog', { name: 'Publish this project?' }).getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Open for quotes').first()).toBeVisible();

  await becomePersona(page, CONTRACTOR);
  await page.goto('/contractor/leads');
  await expect(page.getByRole('link', { name: TITLE })).toBeVisible();
});

test('H2 contractor filters the feed, saves the lead and submits a multi-line quote with correct arithmetic', async () => {
  await page.getByRole('searchbox', { name: 'Search leads' }).fill('E2E bathroom');
  await page.getByRole('button', { name: /^Filters/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  await sheet.getByLabel('Service').selectOption('waterproofing');
  await sheet.getByRole('button', { name: 'Show results' }).click();
  await expect(page.getByText('1 lead', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: TITLE }).click();
  await page.getByRole('button', { name: 'Save lead' }).click();
  await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
  await page.getByRole('button', { name: 'Start a quote' }).click();

  await page.getByLabel('Item 1 description').fill('Cementitious waterproofing, 2 coats');
  await page.getByLabel('Quantity').first().fill('120.5');
  await page.getByLabel('Rate (₹)').first().fill('95.50');
  await page.getByRole('button', { name: 'Add line item' }).click();
  await page.getByLabel('Item 2 description').fill('Ponding test, 24 hours');
  await page.getByLabel('Quantity').nth(1).fill('1');
  await page.getByLabel('Rate (₹)').nth(1).fill('2500');
  // 120.5 × 95.50 = 11,507.75; + 2,500 = 14,007.75; 18% GST = 2,521.40 (half-up); total 16,529.15
  await expect(page.getByText('₹14,007.75')).toBeVisible();
  await expect(page.getByText('₹2,521.40')).toBeVisible();
  await expect(page.getByText('₹16,529.15').first()).toBeVisible();
  await page.getByRole('button', { name: 'Submit quote' }).click();
  await page.getByRole('dialog', { name: 'Submit this quote?' }).getByRole('button', { name: 'Submit quote' }).click();
  await expect(page).toHaveURL(/\/contractor\/quotes\/qt_/);
});

test('H3 owner opens the notification, compares quotes, requests a revision; contractor resubmits', async () => {
  await becomePersona(page, OWNER);
  await page.goto('/notifications');
  await page.getByRole('button', { name: /New quote received/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: /Quote from Sahyadri/ })).toBeVisible();
  quoteUrl = new URL(page.url()).pathname;

  // The new project has one quote; comparison is exercised on the seeded project with three.
  await page.goto('/owner/projects/prj_seed_terrace/compare');
  await expect(page.getByText('Lowest total').first()).toBeVisible();
  await noHorizontalOverflow(page);

  await page.goto(quoteUrl);
  await page.getByRole('button', { name: 'Request a revision' }).click();
  const dialog = page.getByRole('dialog', { name: 'Request a revision' });
  await dialog.getByLabel(/What should change/).fill('Please include removal of debris and a 48-hour ponding test.');
  await dialog.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText(/You asked for a revision/)).toBeVisible();

  await becomePersona(page, CONTRACTOR);
  await page.goto('/contractor/quotes');
  await page.getByRole('link', { name: new RegExp(TITLE) }).first().click();
  await expect(page.getByText('The owner asked for a revision')).toBeVisible();
  await page.getByLabel('Rate (₹)').first().fill('90');
  await page.getByRole('button', { name: 'Send revision' }).click();
  await page.getByRole('dialog', { name: 'Send this revision?' }).getByRole('button', { name: 'Send revision' }).click();
  await expect(page).toHaveURL(/\/contractor\/quotes\/qt_/);
  await expect(page.getByText('Revision 2').first()).toBeVisible();
});

test('H4 owner accepts; workspace exists and both sides show the same agreement', async () => {
  await becomePersona(page, OWNER);
  await page.goto(quoteUrl);
  await page.getByRole('button', { name: 'Accept quote' }).click();
  await page.getByRole('dialog', { name: /Accept Sahyadri/ }).getByRole('button', { name: 'Accept and create workspace' }).click();
  await expect(page).toHaveURL(/\/workspace\/ws_/);
  workspaceUrl = new URL(page.url()).pathname;
  const ownerAgreement = await page.getByText(/^Agreed ₹/).first().textContent();
  await expect(page.getByText('Awarded').first()).toBeVisible();

  await becomePersona(page, CONTRACTOR);
  await page.goto('/contractor/quotes');
  await expect(page.getByRole('link', { name: new RegExp(TITLE) }).first()).toContainText('Accepted');
  await page.goto(workspaceUrl);
  await expect(page.getByText(/^Agreed ₹/).first()).toHaveText(ownerAgreement ?? '');
});

test('H5 messages, unread state, site update and milestone review persist across refreshes', async () => {
  // Contractor messages the owner from the workspace.
  await page.getByRole('link', { name: 'Messages' }).first().click();
  await page.getByLabel(/Message to Meera Kulkarni/).fill('We start on Monday at 9 am.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('log').getByText('We start on Monday at 9 am.')).toBeVisible();

  await becomePersona(page, OWNER);
  await page.goto('/messages');
  // The newest conversation (this project) is first and shows as unread for the owner.
  const thread = page.getByRole('link', { name: /We start on Monday/ });
  await expect(thread).toContainText('unread');
  const href = await thread.getAttribute('href');
  await thread.click();
  await expect(page.getByRole('log').getByText('We start on Monday at 9 am.')).toBeVisible();
  await page.reload();
  await page.goto('/messages');
  await expect(page.locator(`a[href="${href}"]`)).not.toContainText('unread');

  // Contractor posts an update and works on milestone 1.
  await becomePersona(page, CONTRACTOR);
  await page.goto(`${workspaceUrl}/updates`);
  await page.getByLabel('What happened on site?').fill('Surface cleaned and primer applied to floor and shower walls.');
  await page.getByLabel(/Your progress estimate/).fill('15');
  await page.getByRole('button', { name: 'Post update' }).click();
  await expect(page.getByText('Surface cleaned and primer applied').first()).toBeVisible();
  await page.goto(`${workspaceUrl}/milestones`);
  await page.getByRole('button', { name: 'Start milestone' }).first().click();
  await page.getByRole('button', { name: 'Submit for approval' }).first().click();
  await page.getByRole('dialog').getByLabel(/What was done/).fill('Primer and first coat done; ready for inspection.');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit milestone' }).click();
  await page.reload();
  await expect(page.getByText('Awaiting approval').first()).toBeVisible();

  // Owner requests changes, contractor resubmits, owner approves.
  await becomePersona(page, OWNER);
  await page.goto(`${workspaceUrl}/milestones`);
  await page.getByRole('button', { name: 'Request changes' }).first().click();
  await page.getByRole('dialog').getByLabel(/What needs to change/).fill('Coving at the wall-floor joint is missing in one corner.');
  await page.getByRole('dialog').getByRole('button', { name: 'Send request' }).click();
  await becomePersona(page, CONTRACTOR);
  await page.goto(`${workspaceUrl}/milestones`);
  await page.getByRole('button', { name: 'Resume work' }).click();
  await page.getByRole('button', { name: 'Submit for approval' }).first().click();
  await page.getByRole('dialog').getByLabel(/What was done/).fill('Coving added in the corner; photos in documents.');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit milestone' }).click();
  await becomePersona(page, OWNER);
  await page.goto(`${workspaceUrl}/milestones`);
  await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Approve milestone' }).click();
  await page.reload();
  await expect(page.getByText('Approved').first()).toBeVisible();
});

test('H6 complete the project, review once, aggregate updates', async () => {
  for (let i = 0; i < 2; i += 1) {
    await becomePersona(page, CONTRACTOR);
    await page.goto(`${workspaceUrl}/milestones`);
    await page.getByRole('button', { name: 'Start milestone' }).first().click();
    await page.getByRole('button', { name: 'Submit for approval' }).first().click();
    await page.getByRole('dialog').getByLabel(/What was done/).fill(`Stage ${i + 2} complete and cleaned up.`);
    await page.getByRole('dialog').getByRole('button', { name: 'Submit milestone' }).click();
    await becomePersona(page, OWNER);
    await page.goto(`${workspaceUrl}/milestones`);
    await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Approve milestone' }).click();
  }
  await page.goto('/owner/contractors/usr_ctr_sahyadri');
  const before = await page.getByText(/· \d+ reviews/).first().textContent();
  await page.goto(workspaceUrl);
  await page.getByRole('button', { name: 'Mark project complete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Mark complete' }).click();
  await expect(page).toHaveURL(/\/review$/);
  await page.getByRole('group', { name: /Overall rating/ }).getByText('5', { exact: true }).click();
  await page.getByLabel('Your experience').fill('Clear written scope, tidy site and honest about the ponding test.');
  await page.getByRole('button', { name: 'Publish review' }).click();
  await expect(page.getByRole('heading', { name: 'Your review' })).toBeVisible();
  await page.goto('/owner/contractors/usr_ctr_sahyadri');
  const after = await page.getByText(/· \d+ reviews/).first().textContent();
  expect(Number(after?.match(/(\d+) reviews/)?.[1])).toBe(Number(before?.match(/(\d+) reviews/)?.[1]) + 1);
  await page.goto(`${workspaceUrl}/review`);
  await expect(page.getByRole('button', { name: 'Publish review' })).toHaveCount(0);
});

test('H7 reset restores the original seed scenario', async () => {
  await resetDemo(page);
  await becomePersona(page, OWNER);
  await page.goto('/owner/projects');
  await expect(page.getByText('5 of 5 projects')).toBeVisible();
  await expect(page.getByText(TITLE)).toHaveCount(0);
});

test('H8 failure paths: no results, invalid input, empty messages, cancelled dialogs, bad storage', async () => {
  await page.goto('/owner/contractors');
  await page.getByRole('searchbox', { name: 'Search contractors' }).fill('zzzz no such contractor');
  await expect(page.getByText('No contractors match these filters')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();

  await page.goto('/owner/projects/new');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Choose a service category.')).toBeVisible();

  await page.goto('/messages/cnv_seed_bathroom');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Write a message before sending.')).toBeVisible();

  await page.goto('/owner/projects/prj_seed_terrace/quotes/qt_seed_terrace_deccan');
  await page.getByRole('button', { name: 'Accept quote' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/owner/projects/prj_seed_terrace');
  await expect(page.getByText('Reviewing quotes').first()).toBeVisible();

  await becomePersona(page, CONTRACTOR);
  await page.goto('/contractor/leads/prj_seed_basement/quote');
  await page.getByLabel('Quantity').first().fill('-5');
  await page.getByRole('button', { name: 'Submit quote' }).click();
  await expect(page.getByText('Quantity must be greater than 0.').first()).toBeVisible();

  // Malformed storage recovers to the seed with a notice.
  await page.evaluate(() => localStorage.setItem('avenbuild.demo', '{"schemaVersion":1,"data":{broken'));
  await page.goto('/start');
  await page.getByRole('button', { name: new RegExp(OWNER) }).click();
  await expect(page.getByText(/Saved demo data in this browser was damaged/)).toBeVisible();

  // A full storage quota keeps the app working and says changes can't be saved.
  const quotaPage = page;
  await quotaPage.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (key === 'avenbuild.demo' && (window as unknown as { __fillQuota?: boolean }).__fillQuota) throw new DOMException('Quota exceeded', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await quotaPage.goto('/owner/shortlist');
  await quotaPage.evaluate(() => {
    (window as unknown as { __fillQuota?: boolean }).__fillQuota = true;
  });
  await quotaPage.getByRole('button', { name: 'Shortlisted' }).first().click();
  await expect(quotaPage.getByText('Changes in this session can’t be saved in this browser.')).toBeVisible();

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
});
