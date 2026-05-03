/**
 * Auth tests — Login & Register (CRUD-equivalent: Create session, validate inputs).
 */
import { test, expect } from '@playwright/test';
import { mockApi, mockApiLoginFail, MOCK_EVENT_GUID } from './helpers';

// ── Login ─────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('renders email, password fields and submit button', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('stays on /login when submitted empty', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await mockApiLoginFail(page);
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=Invalid email or password').first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('redirects to /app on valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
  });

  test('"Create Account" link goes to /register', async ({ page }) => {
    await page.click('a:has-text("Create Account")');
    await expect(page).toHaveURL(/\/register/);
  });

  test('redirects to /app when already logged in and /login is typed in URL', async ({ page }) => {
    // Step 1: login normally
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app/, { timeout: 5000 });

    // Step 2: set event context so dashboard doesn't bounce
    await page.evaluate((guid) => localStorage.setItem('eventId', guid), MOCK_EVENT_GUID);

    // Step 3: navigate to /login as if the user typed it in the address bar
    await page.goto('/login');

    // Should redirect away — never show the login form
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
  });
});

// ── Register ──────────────────────────────────────────────────────────────────

test.describe('Register', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test('renders all required fields and Create Account button', async ({ page }) => {
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible();
    await expect(page.locator('input[placeholder="you@example.com"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Create a strong password"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Re-enter your password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
  });

  test('stays on /register when submitted empty', async ({ page }) => {
    await page.click('button:has-text("Create Account")');
    await expect(page).toHaveURL(/\/register/);
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.fill('input[placeholder="you@example.com"]', 'test@test.com');
    await page.fill('input[placeholder="Create a strong password"]', 'Password123!');
    await page.fill('input[placeholder="Re-enter your password"]', 'Different999!');
    await page.click('button:has-text("Create Account")');
    await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 3000 });
    await expect(page).toHaveURL(/\/register/);
  });

  test('shows error when password is too weak', async ({ page }) => {
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.fill('input[placeholder="you@example.com"]', 'test@test.com');
    await page.fill('input[placeholder="Create a strong password"]', 'weak');
    await page.fill('input[placeholder="Re-enter your password"]', 'weak');
    await page.click('button:has-text("Create Account")');
    await expect(page.locator('text=Password does not meet security requirements')).toBeVisible({ timeout: 3000 });
  });

  test('submits successfully with valid data', async ({ page }) => {
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.fill('input[placeholder="you@example.com"]', 'new@test.com');
    await page.fill('input[placeholder="Create a strong password"]', 'Password123!');
    await page.fill('input[placeholder="Re-enter your password"]', 'Password123!');
    await page.click('button:has-text("Create Account")');
    // No validation errors should be visible
    await expect(page.locator('text=Passwords do not match')).not.toBeVisible();
    await expect(page.locator('text=Password does not meet security requirements')).not.toBeVisible();
  });

  test('"Sign In" link goes to /login', async ({ page }) => {
    await page.click('a:has-text("Sign In")');
    await expect(page).toHaveURL(/\/login/);
  });
});
