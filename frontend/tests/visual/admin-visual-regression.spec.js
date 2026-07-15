import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  navigateToAdminPage,
  waitForPageReady,
  takeFullPageScreenshot,
  takeViewportScreenshot,
  ADMIN_PAGES,
} from './helpers/admin-pages';

test.describe('Admin Pages - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const pageConfig of ADMIN_PAGES) {
    test(`${pageConfig.name} - full page screenshot`, async ({ page }) => {
      await navigateToAdminPage(page, pageConfig.path);
      await takeFullPageScreenshot(page, `admin-${pageConfig.name}`);
    });

    test(`${pageConfig.name} - viewport screenshot`, async ({ page }) => {
      await navigateToAdminPage(page, pageConfig.path);
      await takeViewportScreenshot(page, `admin-${pageConfig.name}`);
    });
  }
});

test.describe('Admin Login - Visual Regression', () => {
  test('login page - full screenshot', async ({ page }) => {
    await page.goto('http://localhost:5180/admin');
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('admin-login.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('login page - viewport screenshot', async ({ page }) => {
    await page.goto('http://localhost:5180/admin');
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('admin-login-viewport.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });
});
