import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    animation: 'disabled',
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
