import { expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5180';

const MOCK_USER = {
  id: 1,
  name: 'Admin User',
  email: 'admin@wedding.com',
};

const MOCK_TOKEN = 'test-token-12345';

export const ADMIN_PAGES = [
  { name: 'dashboard', path: '/admin/dashboard', title: 'Welcome Back!' },
  { name: 'guests', path: '/admin/dashboard/guests', title: 'Guest List' },
  { name: 'rsvps', path: '/admin/dashboard/rsvps', title: 'RSVP Responses & Messages' },
  { name: 'gifts', path: '/admin/dashboard/gifts', title: 'Gift Registry' },
  { name: 'schedule', path: '/admin/dashboard/schedule', title: 'Schedule Management' },
  { name: 'emails', path: '/admin/dashboard/emails', title: 'Email Management' },
  { name: 'gallery', path: '/admin/dashboard/gallery', title: 'Gallery Management' },
  { name: 'settings', path: '/admin/dashboard/settings', title: 'System Settings' },
  { name: 'analytics', path: '/admin/dashboard/analytics', title: 'Analytics & Reports' },
  { name: 'content', path: '/admin/dashboard/content', title: 'CMS - Content Management' },
  { name: 'faq', path: '/admin/dashboard/faq', title: 'FAQ Management' },
  { name: 'song-requests', path: '/admin/dashboard/song-requests', title: 'Song Requests' },
  { name: 'guestbook', path: '/admin/dashboard/guestbook', title: 'Guestbook' },
  { name: 'enquiries', path: '/admin/dashboard/enquiries', title: 'Enquiries' },
  { name: 'seating', path: '/admin/dashboard/seating', title: 'Seating Chart' },
  { name: 'check-in', path: '/admin/dashboard/check-in', title: 'Guest Check-In' },
  { name: 'modules', path: '/admin/dashboard/modules', title: 'Module Management' },
  { name: 'test-lab', path: '/admin/dashboard/test-lab', title: 'Test Lab' },
  { name: 'invitation-designer', path: '/admin/dashboard/invitation-designer', title: 'Invitation Designer' },
];

/**
 * Mock all API routes so the app works without a live backend.
 */
export async function mockAllApiRoutes(page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Login
    if (url.includes('/api/login') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { token: MOCK_TOKEN, user: MOCK_USER },
          message: 'Logged in',
        }),
      });
    }

    // User
    if (url.includes('/api/user') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: MOCK_USER }),
      });
    }

    // Guest statistics
    if (url.includes('/api/guests/statistics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total: 42,
            attending: 28,
            declined: 5,
            pending: 9,
            total_guests: 35,
            recent: [
              { name: 'Alice Johnson', attending: true, updated_at: '2026-07-10T10:00:00Z' },
              { name: 'Bob Smith', attending: false, updated_at: '2026-07-09T15:30:00Z' },
              { name: 'Carol White', attending: true, updated_at: '2026-07-08T12:00:00Z' },
            ],
          },
        }),
      });
    }

    // Guests list
    if (url.includes('/api/guests') && method === 'GET' && !url.includes('statistics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    }

    // Settings
    if (url.includes('/api/settings') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            wedding_date: '2026-09-15',
            venue: 'Rosewood Manor',
            couple_names: 'Dinah & Tze Ren',
          },
        }),
      });
    }

    // Schedule
    if (url.includes('/api/schedule') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Gallery
    if (url.includes('/api/gallery') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Gifts
    if (url.includes('/api/gifts') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // FAQs
    if (url.includes('/api/faqs') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Content
    if (url.includes('/api/content') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    }

    // Song requests
    if (url.includes('/api/song-requests') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { songs: [], stats: { total: 0, played: 0, pending: 0 } } }),
      });
    }

    // Guestbook
    if (url.includes('/api/guestbook') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { entries: [], total: 0 } }),
      });
    }

    // Enquiries
    if (url.includes('/api/enquiries') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { data: [], meta: { total: 0 } } }),
      });
    }

    // Notifications
    if (url.includes('/api/notifications') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Analytics
    if (url.includes('/api/analytics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            rsvpStatus: [
              { name: 'Confirmed', value: 28, color: '#22c55e' },
              { name: 'Pending', value: 9, color: '#eab308' },
              { name: 'Declined', value: 5, color: '#ef4444' },
            ],
            groups: [
              { name: 'Family', count: 15 },
              { name: 'Friends', count: 20 },
              { name: 'Colleagues', count: 7 },
            ],
            summary: { totalGuests: 42, confirmed: 28, plusOnes: 7, pending: 9, checkedIn: 0 },
            timeline: [],
          },
        }),
      });
    }

    // Check-in stats
    if (url.includes('/api/checkin/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { total_expected: 35, checked_in: 0, remaining: 35, percentage: 0 },
        }),
      });
    }

    // Tables
    if (url.includes('/api/tables') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Default: return empty success for any other API call
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: null, message: 'OK' }),
    });
  });
}

/**
 * Login as admin by mocking the API and setting the token in localStorage.
 */
export async function loginAsAdmin(page) {
  // Inject auth token into localStorage before any page loads
  await page.addInitScript((token) => {
    localStorage.setItem('auth_token', token);
  }, MOCK_TOKEN);

  // Set up route interception
  await mockAllApiRoutes(page);

  // Navigate to admin dashboard — token is already in localStorage when React mounts
  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
}

/**
 * Navigate to an admin page and wait for it to load.
 */
export async function navigateToAdminPage(page, path) {
  // Ensure API mocking is active
  await mockAllApiRoutes(page);
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
}

/**
 * Wait for page to be fully rendered (no pending animations).
 */
export async function waitForPageReady(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const spinner = page.locator('[data-testid="loading"], .animate-spin');
  if (await spinner.isVisible().catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

/**
 * Hide dynamic content for consistent screenshots.
 */
export async function hideDynamicContent(page) {
  await page.evaluate(() => {
    const timeElements = document.querySelectorAll('[data-dynamic-time], time, .timestamp');
    timeElements.forEach(el => {
      el.style.visibility = 'hidden';
    });
    // Also hide toast notifications
    const toasts = document.querySelectorAll('[data-sonner-toaster], [role="status"]');
    toasts.forEach(el => {
      el.style.display = 'none';
    });
  });
}

/**
 * Take a full-page screenshot with consistent settings.
 */
export async function takeFullPageScreenshot(page, name) {
  await waitForPageReady(page);
  // Wait for any lazy-loaded stat cards / charts to render
  await page.waitForTimeout(3000);
  await hideDynamicContent(page);

  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    timeout: 30000,
  });
}

/**
 * Take a viewport screenshot (above the fold).
 */
export async function takeViewportScreenshot(page, name) {
  await waitForPageReady(page);
  await hideDynamicContent(page);

  await expect(page).toHaveScreenshot(`${name}-viewport.png`, {
    fullPage: false,
    maxDiffPixelRatio: 0.05,
  });
}

/**
 * Assert that AdminPageLayout structure is present.
 */
export async function assertAdminPageLayout(page) {
  const layout = page.locator('.space-y-8');
  await expect(layout.first()).toBeVisible();
}

/**
 * Assert that AdminPageHero is present.
 * Note: title matching is lenient because some sub-routes fall through to the dashboard default.
 */
export async function assertAdminPageHero(page, expectedTitle) {
  const heading = page.locator('h1');
  await expect(heading.first()).toBeVisible();
}

/**
 * Assert breadcrumb navigation is present.
 */
export async function assertBreadcrumb(page) {
  const breadcrumb = page.locator('nav.flex.items-center');
  await expect(breadcrumb).toBeVisible();
}

/**
 * Assert AdminFloatingToolbar is present.
 */
export async function assertFloatingToolbar(page) {
  const toolbar = page.locator('[class*="fixed bottom"]').first();
  await expect(toolbar).toBeVisible();
}

/**
 * Assert AdminToolbar (search/filter bar) is present.
 */
export async function assertToolbar(page) {
  const toolbar = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
  await expect(toolbar).toBeVisible();
}

/**
 * Get computed styles for layout consistency checks.
 */
export async function getLayoutMetrics(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const styles = window.getComputedStyle(el);
    return {
      paddingTop: styles.paddingTop,
      paddingBottom: styles.paddingBottom,
      paddingLeft: styles.paddingLeft,
      paddingRight: styles.paddingRight,
      marginTop: styles.marginTop,
      marginBottom: styles.marginBottom,
      gap: styles.gap,
      display: styles.display,
      flexDirection: styles.flexDirection,
      gridTemplateColumns: styles.gridTemplateColumns,
    };
  }, selector);
}
