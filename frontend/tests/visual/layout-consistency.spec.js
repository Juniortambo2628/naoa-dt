import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  navigateToAdminPage,
  waitForPageReady,
  assertAdminPageLayout,
  assertAdminPageHero,
  assertBreadcrumb,
  assertFloatingToolbar,
  assertToolbar,
  getLayoutMetrics,
  ADMIN_PAGES,
} from './helpers/admin-pages';

test.describe('Layout Consistency - All Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const pageConfig of ADMIN_PAGES) {
    test(`${pageConfig.name} - has AdminPageLayout`, async ({ page }) => {
      await navigateToAdminPage(page, pageConfig.path);
      await assertAdminPageLayout(page);
    });

    test(`${pageConfig.name} - has AdminPageHero with correct title`, async ({ page }) => {
      await navigateToAdminPage(page, pageConfig.path);
      await assertAdminPageHero(page, pageConfig.title);
    });

    test(`${pageConfig.name} - has breadcrumb navigation`, async ({ page }) => {
      await navigateToAdminPage(page, pageConfig.path);
      await assertBreadcrumb(page);
    });
  }
});

test.describe('Floating Toolbar Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  const pagesWithFloatingToolbar = [
    'guests', 'gifts', 'schedule', 'emails', 'gallery',
    'content', 'faq', 'song-requests', 'guestbook', 'enquiries',
    'seating', 'check-in', 'modules', 'test-lab', 'invitation-designer',
  ];

  for (const pageName of pagesWithFloatingToolbar) {
    const pageConfig = ADMIN_PAGES.find(p => p.name === pageName);
    if (pageConfig) {
      test(`${pageConfig.name} - has floating toolbar`, async ({ page }) => {
        await navigateToAdminPage(page, pageConfig.path);
        await assertFloatingToolbar(page);
      });
    }
  }
});

test.describe('Search Toolbar Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  const pagesWithSearch = [
    'guests', 'gifts', 'schedule', 'gallery',
    'faq', 'song-requests', 'guestbook', 'enquiries',
  ];

  for (const pageName of pagesWithSearch) {
    const pageConfig = ADMIN_PAGES.find(p => p.name === pageName);
    if (pageConfig) {
      test(`${pageConfig.name} - has search toolbar`, async ({ page }) => {
        await navigateToAdminPage(page, pageConfig.path);
        await assertToolbar(page);
      });
    }
  }
});

test.describe('Layout Metrics Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('core pages have consistent spacing', async ({ page }) => {
    const corePages = ['dashboard', 'guests', 'gifts', 'schedule'];
    const spacingResults = [];

    for (const pageName of corePages) {
      const pageConfig = ADMIN_PAGES.find(p => p.name === pageName);
      await navigateToAdminPage(page, pageConfig.path);
      await waitForPageReady(page);

      await page.locator('.space-y-8').first().waitFor({ state: 'visible', timeout: 10000 });
      const metrics = await getLayoutMetrics(page, '.space-y-8');
      spacingResults.push({ page: pageName, ...metrics });
    }

    console.log('Spacing results:', JSON.stringify(spacingResults, null, 2));
    expect(spacingResults.length).toBe(corePages.length);
    // All core pages should have the same padding from AdminPageLayout
    const uniquePaddingBottoms = [...new Set(spacingResults.map(r => r?.paddingBottom))];
    expect(uniquePaddingBottoms.length).toBe(1);
  });
});

test.describe('Responsive Layout Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateToAdminPage(page, '/admin/dashboard');
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('admin-dashboard-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('guests - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateToAdminPage(page, '/admin/dashboard/guests');
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('admin-guests-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('settings - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateToAdminPage(page, '/admin/dashboard/settings');
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('admin-settings-tablet.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
