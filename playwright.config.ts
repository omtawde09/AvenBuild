import { defineConfig } from '@playwright/test';

/**
 * End-to-end acceptance, responsive and accessibility checks.
 * Uses an installed browser channel (Microsoft Edge by default; set PW_CHANNEL=chrome to use Chrome)
 * so no browser binaries need to be downloaded. Runs against a production build served by `vite preview`.
 */
const PORT = 4174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.PW_CHANNEL ?? 'msedge',
    trace: 'retain-on-failure',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'mobile', testMatch: /acceptance\.spec\.ts/, use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true } },
    { name: 'desktop', testMatch: /(responsive|a11y)\.spec\.ts/, use: { viewport: { width: 1280, height: 800 } } },
  ],
});
