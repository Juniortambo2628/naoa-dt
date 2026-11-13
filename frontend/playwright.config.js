import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Each test mocks its own API, so files run side by side: on CI's 4-core
  // runner this takes the suite from ~18 minutes to a few.
  workers: process.env.CI ? 4 : 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    animation: 'disabled',
    // Optional: point at an installed Chromium (e.g. a sandbox without the
    // exact browser build this Playwright version expects).
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {}),
    // Start every test with the cookie banner answered and the admin tour
    // finished, so screenshots show the page itself rather than pop-ups.
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:5180',
        localStorage: [
          { name: 'cookie-consent', value: 'accepted' },
          { name: 'admin-tutorial-complete', value: 'true' },
        ],
      }],
    },
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5180',
    reuseExistingServer: true,
    timeout: 60000,
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      threshold: 0.4,
      animations: 'disabled',
      timeout: 10000,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.05,
    },
  },

  outputDir: './tests/visual/test-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
});
