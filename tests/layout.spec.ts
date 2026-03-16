/**
 * Layout & visual correctness tests.
 * Uses screenshot regression to catch unintended UI changes.
 *
 * First run: snapshots are created in tests/__snapshots__/
 * Subsequent runs: compared against those baselines.
 * Update snapshots: npx playwright test --update-snapshots
 */
import { test, expect } from '@playwright/test';
import { mockApi, setMockAuth, MOCK_SHARE_TOKEN, MOCK_EVENT_GUID } from './helpers';

// ── Public pages ──────────────────────────────────────────────────────────────

test.describe('Public pages layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('landing page renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing.png', { fullPage: true });
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Ensure form fields are visible
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('register.png', { fullPage: true });
  });

  test('public RSVP submit page renders correctly', async ({ page }) => {
    await page.goto(`/rsvp/submit/${MOCK_SHARE_TOKEN}?event=${MOCK_EVENT_GUID}`);
    await page.waitForLoadState('networkidle');
    // Should not show error state
    await expect(page.locator('text=Invalid or expired link')).not.toBeVisible();
    await expect(page).toHaveScreenshot('rsvp-submit.png', { fullPage: true });
  });
});

// ── Dashboard pages ───────────────────────────────────────────────────────────

test.describe('Dashboard pages layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await setMockAuth(page);
  });

  test('dashboard renders correctly', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
  });

  test('events page renders correctly', async ({ page }) => {
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('events.png', { fullPage: true });
  });

  test('guests page renders correctly', async ({ page }) => {
    await page.goto('/app/guests');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('guests.png', { fullPage: true });
  });

  test('wallet page renders correctly', async ({ page }) => {
    await page.goto('/app/wallet');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('wallet.png', { fullPage: true });
  });
});
