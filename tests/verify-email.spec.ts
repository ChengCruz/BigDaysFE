/**
 * Verify-email page: prefill from the email link fragment (#email=...&code=...).
 * The fragment must prefill but never auto-submit, and must be removed from the URL.
 */
import { test, expect } from '@playwright/test';
import { mockApi } from './helpers';

const EMAIL = 'ana+test@example.com';
const CODE = '123456';
const goodHash = `#email=${encodeURIComponent(EMAIL)}&code=${CODE}`;

test.describe('Verify email fragment', () => {
  test('prefills email and code and removes the fragment from the URL', async ({ page }) => {
    await mockApi(page);
    await page.goto(`/verify-email${goodHash}`);
    await expect(page.locator('input[type="email"]')).toHaveValue(EMAIL);
    await expect(page.locator('input[inputmode="numeric"]')).toHaveValue(CODE);
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');
    await expect(page).toHaveURL(/\/verify-email$/);
  });

  test('sends no verify request until the button is pressed', async ({ page }) => {
    await mockApi(page);
    const verifyCalls: string[] = [];
    page.on('request', req => {
      if (/\/User\/VerifyEmail/i.test(req.url())) verifyCalls.push(req.url());
    });
    await page.goto(`/verify-email${goodHash}`);
    await expect(page.locator('input[inputmode="numeric"]')).toHaveValue(CODE);
    await page.waitForLoadState('networkidle');
    expect(verifyCalls).toHaveLength(0);

    const reqPromise = page.waitForRequest(r => /\/User\/VerifyEmail/i.test(r.url()));
    await page.click('button[type="submit"]');
    const req = await reqPromise;
    expect(req.postDataJSON()).toEqual({ email: EMAIL, code: CODE });
    expect(verifyCalls).toHaveLength(1);
  });

  for (const [name, hash] of [
    ['short code', `#email=${encodeURIComponent(EMAIL)}&code=12345`],
    ['non-numeric code', `#email=${encodeURIComponent(EMAIL)}&code=12ab56`],
    ['invalid email', '#email=not-an-email&code=123456'],
    ['garbage', '#%E0%A4%A&&=='],
  ] as const) {
    test(`ignores malformed fragment: ${name}`, async ({ page }) => {
      await mockApi(page);
      await page.goto(`/verify-email${hash}`);
      await expect(page.locator('input[type="email"]')).toHaveValue('');
      await expect(page.locator('input[inputmode="numeric"]')).toHaveValue('');
      await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');
    });
  }
});

test.describe('Verify email success modal', () => {
  test('shows a confirmation modal, then moves on to sign-in by itself', async ({ page }) => {
    await mockApi(page);
    await page.goto(`/verify-email${goodHash}`);
    await page.click('button[type="submit"]');

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('verified');
    // The modal stays up for a few seconds first, so the user can read it.
    await expect(page).toHaveURL(/\/verify-email$/);
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('"Sign in now" goes to sign-in straight away', async ({ page }) => {
    await mockApi(page);
    await page.goto(`/verify-email${goodHash}`);
    await page.click('button[type="submit"]');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /sign in now/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('a rejected code shows the error and no modal', async ({ page }) => {
    await mockApi(page);
    await page.route('**/User/VerifyEmail**', route =>
      route.fulfill({ status: 200, json: { isSuccess: false, message: 'Invalid or expired verification code.' } }),
    );
    await page.goto(`/verify-email${goodHash}`);
    await page.click('button[type="submit"]');

    await expect(page.getByText('Invalid or expired verification code.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/verify-email$/);
  });
});
