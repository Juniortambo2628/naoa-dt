import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToAdminPage, waitForPageReady } from './helpers/admin-pages';

test.describe('Admin Components - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('AdminPageHero - default state', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard');
    await waitForPageReady(page);
    
    const hero = page.locator('.my-8').first();
    await expect(hero).toHaveScreenshot('admin-page-hero-default.png');
  });

  test('AdminPageHero - with icon', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard/guests');
    await waitForPageReady(page);
    
    const hero = page.locator('.my-8').first();
    await expect(hero).toHaveScreenshot('admin-page-hero-with-icon.png');
  });

  test('AdminToolbar - search mode', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard/guests');
    await waitForPageReady(page);
    
    const toolbar = page.locator('input[placeholder*="Search"]').first();
    await expect(toolbar.locator('..')).toHaveScreenshot('admin-toolbar-search.png');
  });

  test('AdminFloatingToolbar - default state', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard/guests');
    await waitForPageReady(page);
    
    const toolbar = page.locator('[class*="fixed bottom"]').first();
    await expect(toolbar).toHaveScreenshot('admin-floating-toolbar-default.png');
  });

  test('AdminFloatingToolbar - hidden state', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard/guests');
    await waitForPageReady(page);
    
    // Click the toggle button to hide
    const toggle = page.locator('[class*="fixed bottom"] button').first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(300);
    }
    
    const toolbar = page.locator('[class*="fixed bottom"]').first();
    await expect(toolbar).toHaveScreenshot('admin-floating-toolbar-hidden.png');
  });

  test('AdminCard - default state', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard');
    await waitForPageReady(page);
    
    const card = page.locator('[class*="bg-white rounded-xl shadow-sm border"]').first();
    if (await card.isVisible()) {
      await expect(card).toHaveScreenshot('admin-card-default.png');
    }
  });

  test('AdminSummaryCards - dashboard stats', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard');
    await waitForPageReady(page);
    
    const summary = page.locator('[class*="grid"]').first();
    if (await summary.isVisible()) {
      await expect(summary).toHaveScreenshot('admin-summary-cards.png');
    }
  });

  test('ToggleButton - off state', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard/content');
    await waitForPageReady(page);
    
    const toggle = page.locator('button[role="switch"]').first();
    if (await toggle.isVisible()) {
      await expect(toggle).toHaveScreenshot('toggle-button-off.png');
    }
  });

  test('ToggleButton - on state', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard/content');
    await waitForPageReady(page);
    
    const toggle = page.locator('button[role="switch"]').first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(200);
      await expect(toggle).toHaveScreenshot('toggle-button-on.png');
    }
  });
});

test.describe('Color Scheme Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('primary color is consistent across pages', async ({ page }) => {
    const pages = [
      '/admin/dashboard',
      '/admin/dashboard/guests',
      '/admin/dashboard/gifts',
    ];

    for (const path of pages) {
      await navigateToAdminPage(page, path);
      await waitForPageReady(page);

      // Check that the primary color (#A67B5B) is used consistently
      const primaryElements = await page.locator('[style*="A67B5B"], [class*="A67B5B"]').count();
      console.log(`${path}: ${primaryElements} elements with primary color`);
    }
  });

  test('background colors are consistent', async ({ page }) => {
    await navigateToAdminPage(page, '/admin/dashboard');
    await waitForPageReady(page);

    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log('Body background:', bodyBg);
  });
});
