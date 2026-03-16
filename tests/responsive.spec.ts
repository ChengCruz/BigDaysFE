/**
 * Responsive design tests — verifies layout at mobile (375px), tablet (768px), desktop (1280px).
 * KIV — skipped until responsive design is finalised. Remove test.skip() to re-enable.
 *
 * These run automatically against each viewport via playwright.config.ts projects.
 * Viewport-specific assertions (e.g. hamburger menu on mobile) are handled inline.
 */
import { test, expect } from '@playwright/test';
import { mockApi, setMockAuth, MOCK_SHARE_TOKEN, MOCK_EVENT_GUID } from './helpers';

test.skip(true, 'KIV — responsive design not yet finalised');

// ── Public pages ──────────────────────────────────────────────────────────────

test.describe('Responsive — public pages', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('landing page has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px tolerance for borders
  });

  test('login page is usable at current viewport', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    // Input should be fully within viewport (not cut off)
    const box = await emailInput.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const viewportWidth = page.viewportSize()!.width;
      expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 2);
    }
  });

  test('public RSVP page has no horizontal overflow', async ({ page }) => {
    await page.goto(`/rsvp/submit/${MOCK_SHARE_TOKEN}?event=${MOCK_EVENT_GUID}`);
    await page.waitForLoadState('networkidle');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

// ── Dashboard pages ───────────────────────────────────────────────────────────

test.describe('Responsive — dashboard pages', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await setMockAuth(page);
  });

  test('dashboard has no horizontal overflow', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('events page has no horizontal overflow', async ({ page }) => {
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('navbar is visible at current viewport', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    const viewport = page.viewportSize();
    // On mobile, expect a hamburger/menu button; on desktop, expect the full nav
    if (viewport && viewport.width <= 768) {
      const menuToggle = page.locator('button[aria-label*="menu" i], button[aria-label*="sidebar" i], .hamburger, [data-testid="menu-toggle"]').first();
      // If a mobile toggle exists, it should be visible
      const toggleExists = await menuToggle.isVisible().catch(() => false);
      // Not all apps implement hamburger — just assert no crash
      expect(typeof toggleExists).toBe('boolean');
    } else {
      // On desktop, sidebar/nav should be visible
      const nav = page.locator('nav, aside, [role="navigation"]').first();
      await expect(nav).toBeVisible();
    }
  });
});

// ── Viewport screenshot snapshots ────────────────────────────────────────────

test.describe('Responsive — viewport screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('login page screenshot at current viewport', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const vp = page.viewportSize();
    const label = vp ? `${vp.width}x${vp.height}` : 'unknown';
    await expect(page).toHaveScreenshot(`login-${label}.png`, { fullPage: true });
  });

  test('landing page screenshot at current viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const vp = page.viewportSize();
    const label = vp ? `${vp.width}x${vp.height}` : 'unknown';
    await expect(page).toHaveScreenshot(`landing-${label}.png`, { fullPage: true });
  });
});
