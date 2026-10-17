/**
 * Guest data purge notice on the owner's events page (/app/events).
 *
 * Guest data is removed 90 days after the event date. From 30 days before that
 * purge date a one-time banner warns the owner; once the purge has run
 * (guestDataPurgedAt set) a quiet line replaces it. All dates are built
 * relative to today so the spec does not rot.
 */
import { test, expect, type Page } from '@playwright/test';
import { gotoAuthenticated, MOCK_EVENT, MOCK_EVENT_GUID } from './helpers';

/** Local YYYY-MM-DD for today + n days (local parts, not toISOString: see guest-export.spec.ts). */
function dateNDaysAway(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/** Same format as formatEventDate: "01 Dec 2026". */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en', {
    month: 'short',
    timeZone: 'UTC',
  });
  return `${String(d).padStart(2, '0')} ${month} ${y}`;
}

/** Opens /app/events with an event whose date is `daysAgo` days in the past. */
async function gotoEventsWith(
  page: Page,
  daysAgo: number,
  extra: Record<string, unknown> = {}
) {
  await gotoAuthenticated(page, '/app/events');
  await page.route('**/__mock_api__/**', async (route) => {
    const url = route.request().url();
    if (/\/event\//i.test(url) && route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        json: {
          isSuccess: true,
          data: [{ ...MOCK_EVENT, eventDate: dateNDaysAway(-daysAgo), ...extra }],
        },
      });
    }
    return route.fallback();
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

const banner = (page: Page) =>
  page.getByText(/Guest data for this event will be removed on/);

test.describe('Guest data purge notice', () => {
  test('shows inside the 30 day window with the purge date (event date + 90 days)', async ({ page }) => {
    // Event 60 days ago -> purge date is today + 30, the first day of the window.
    await gotoEventsWith(page, 60);
    const expected = formatDate(dateNDaysAway(30));
    await expect(banner(page)).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: expected })).toContainText(
      `Guest data for this event will be removed on ${expected}, 90 days after the event, as described in our Privacy Notice. Export your guest list before then if you want to keep it.`
    );
    await expect(page.getByRole('link', { name: 'Go to guest list' })).toHaveAttribute('href', '/app/guests');
    await expect(page.getByRole('button', { name: 'Got it' })).toBeVisible();
  });

  test('shows on the purge date itself', async ({ page }) => {
    await gotoEventsWith(page, 90);
    await expect(banner(page)).toContainText(formatDate(dateNDaysAway(0)));
  });

  test('does not show before the window opens', async ({ page }) => {
    // Event 59 days ago -> purge in 31 days.
    await gotoEventsWith(page, 59);
    await expect(page.getByText('Your Events')).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
  });

  test('does not show once the purge date has passed without a purge stamp', async ({ page }) => {
    // Event 91 days ago -> purge date was yesterday, nothing recorded yet.
    await gotoEventsWith(page, 91);
    await expect(page.getByText('Your Events')).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
    await expect(page.getByText(/Guest data was removed on/)).toHaveCount(0);
  });

  test('dismissing hides it and it stays hidden after a reload', async ({ page }) => {
    await gotoEventsWith(page, 60);
    await page.getByRole('button', { name: 'Got it' }).click();
    await expect(banner(page)).toHaveCount(0);
    expect(
      await page.evaluate((id) => localStorage.getItem(`mbd.purgeNotice.${id}`), MOCK_EVENT_GUID)
    ).toBe('1');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Your Events')).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
  });

  test('dismiss button is reachable by keyboard', async ({ page }) => {
    await gotoEventsWith(page, 60);
    const gotIt = page.getByRole('button', { name: 'Got it' });
    await gotIt.focus();
    await expect(gotIt).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(banner(page)).toHaveCount(0);
  });

  test('shows a quiet info line, and no banner, once guest data has been purged', async ({ page }) => {
    const purgedAt = dateNDaysAway(-2);
    await gotoEventsWith(page, 92, { guestDataPurgedAt: `${purgedAt}T03:00:00Z` });
    await expect(
      page.getByText(
        `Guest data was removed on ${formatDate(purgedAt)}, 90 days after the event. Names were replaced with anonymous labels and contact details were deleted.`
      )
    ).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Got it' })).toHaveCount(0);
  });
});
