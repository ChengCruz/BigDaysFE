/**
 * The feedback nudge banner.
 *
 * The backend decides who sees it (private allow-list in server config), so
 * these specs mock GET /feedback/nudge and check only what the page does with
 * the answer: shows when true, never when false or on error, and Close hides it
 * for the session but not forever.
 */
import { test, expect, type Page } from '@playwright/test';
import { gotoAuthenticated, MOCK_USER } from './helpers';

const banner = (page: Page) => page.getByTestId('feedback-nudge-banner');

async function mockNudge(page: Page, reply: { status?: number; show?: boolean }) {
  await page.route('**/__mock_api__/**/feedback/nudge', async (route) => {
    if (reply.status && reply.status !== 200) {
      return route.fulfill({ status: reply.status, json: { isSuccess: false } });
    }
    return route.fulfill({
      status: 200,
      json: { isSuccess: true, data: { show: reply.show ?? false } },
    });
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('feedback nudge banner', () => {
  test('shows with the email when the backend says show', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockNudge(page, { show: true });
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toContainText(`Hi ${MOCK_USER.email}`);
    await expect(banner(page)).toContainText("junk folder");
  });

  test('never shows when the backend says no', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockNudge(page, { show: false });
    await expect(banner(page)).toHaveCount(0);
  });

  test('never shows when the call fails', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockNudge(page, { status: 503 });
    await expect(banner(page)).toHaveCount(0);
  });

  test('Close hides it for this session, and it returns in a fresh session', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockNudge(page, { show: true });
    await expect(banner(page)).toBeVisible();

    await banner(page).getByRole('button', { name: 'Close' }).click();
    await expect(banner(page)).toHaveCount(0);

    // Same session (reload keeps sessionStorage): still closed.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(banner(page)).toHaveCount(0);

    // A new session has no sessionStorage: it comes back, because only a reply
    // (backend list) retires the nudge.
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(banner(page)).toBeVisible();
  });
});
