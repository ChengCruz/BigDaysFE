/**
 * Guest export, the printable check-in sheet, and the paper-backup reminder.
 *
 * These three ship together and exist for one reason: venue Wi-Fi fails, and a
 * couple who cannot log in at the door has no guest list at all. The reminder
 * nags, the export saves a copy, the sheet is the paper fallback.
 *
 * The date maths and the reminder state machine are pure functions and were
 * verified directly. What only a browser can check — and what this file is
 * for — is the wiring: that the dropdown items fire real downloads, that the
 * print stylesheet reveals the right element, and that the modal appears and
 * dismisses on the right days.
 *
 * The print assertions matter most. index.css hides EVERYTHING globally under
 * `@media print` (`body * { visibility: hidden }`, section 6) and each printable
 * surface opts back in. Break that and every print in the app silently produces
 * a blank page, which no other test would catch.
 */
import { test, expect, type Page } from '@playwright/test';
import { gotoAuthenticated, mockApi, MOCK_EVENT, MOCK_EVENT_GUID } from './helpers';

/**
 * A YYYY-MM-DD date `n` days from today, built from LOCAL calendar parts.
 *
 * Deliberately not toISOString().slice(0,10): that is UTC, and in GMT+8 it
 * lands a day early for most of the evening — the exact off-by-one that
 * daysUntilEvent() documents and avoids (eventUtils.ts:6-11).
 */
function dateNDaysAway(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Lands on `path` with the event `days` away, so the reminder window can be
 * driven from a test.
 *
 * The override is registered AFTER gotoAuthenticated (which installs mockApi),
 * because handlers run last-registered-first — same ordering the role helpers
 * in helpers.ts rely on. The reload is what makes EventContext pick up the new
 * date.
 */
async function gotoWithEventInDays(page: Page, days: number, path = '/app/guests') {
  await gotoAuthenticated(page, path);
  await page.route('**/__mock_api__/**', async (route) => {
    const url = route.request().url();
    if (/\/event\//i.test(url) && route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        json: {
          isSuccess: true,
          data: [{ ...MOCK_EVENT, eventDate: dateNDaysAway(days) }],
        },
      });
    }
    return route.fallback();
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/** The reminder waits OPEN_DELAY_MS (1200ms) before interrupting. */
const REMINDER_TIMEOUT = 8000;

const reminderModal = (page: Page) =>
  page.locator('text=A printed guest list is the one backup that always works.');

// ─── Export dropdown ─────────────────────────────────────────────────────────

test.describe('Guests — export dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/guests');
  });

  test('offers XLSX, CSV and the print sheet', async ({ page }) => {
    await page.click('button:has-text("Export")');
    await expect(page.locator('text=Export as XLSX')).toBeVisible();
    await expect(page.locator('text=Export as CSV')).toBeVisible();
    await expect(page.locator('text=Print check-in sheet')).toBeVisible();
  });

  test('CSV export downloads a file named for the event', async ({ page }) => {
    await page.click('button:has-text("Export")');
    const download = page.waitForEvent('download');
    await page.click('text=Export as CSV');
    expect((await download).suggestedFilename()).toBe(`guests-event-${MOCK_EVENT_GUID}.csv`);
  });

  test('XLSX export downloads a file named for the event', async ({ page }) => {
    await page.click('button:has-text("Export")');
    // xlsx is a lazy ~500kb chunk, so the first export waits on a network fetch.
    const download = page.waitForEvent('download', { timeout: 20000 });
    await page.click('text=Export as XLSX');
    expect((await download).suggestedFilename()).toBe(`guests-event-${MOCK_EVENT_GUID}.xlsx`);
  });

  test('"Print check-in sheet" navigates to the sheet', async ({ page }) => {
    await page.click('button:has-text("Export")');
    await page.click('text=Print check-in sheet');
    await expect(page).toHaveURL(/\/app\/guests\/print/);
  });
});

// ─── The sheet ───────────────────────────────────────────────────────────────

test.describe('Check-in print sheet', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/guests/print');
  });

  test('renders one row per party with a tick box', async ({ page }) => {
    const rows = page.locator('.print-sheet tbody tr');
    await expect(rows).toHaveCount(2); // MOCK_GUEST + MOCK_GUEST_ASSIGNED
    await expect(page.locator('.print-sheet')).toContainText('Alice Smith');
    await expect(page.locator('.print-sheet')).toContainText('Bob Jones');
    // One empty box per row, for ticking off at the door.
    await expect(rows.first().locator('span.border')).toBeVisible();
  });

  test('counts parties and pax separately in the header', async ({ page }) => {
    // 2 parties, 3 people (Alice brings 2, Bob 1). A party is the atomic unit
    // here — see docs/COUPLE_MODE.md, "The Guest / RSVP model".
    await expect(page.locator('.print-sheet')).toContainText('2 parties');
    await expect(page.locator('.print-sheet')).toContainText('3 pax');
  });

  test('seated parties come before unassigned ones', async ({ page }) => {
    const firstRow = page.locator('.print-sheet tbody tr').first();
    await expect(firstRow).toContainText('Bob Jones'); // has a table
    await expect(firstRow).toContainText('Table A');
    // Alice has no table and sorts to the end, showing an em dash.
    await expect(page.locator('.print-sheet tbody tr').last()).toContainText('—');
  });

  test('print media reveals the sheet and hides the app chrome', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.print-sheet')).toBeVisible();
    // The screen-only header (title + Back/Print buttons) must not reach paper.
    await expect(page.locator('.print-hide').first()).toBeHidden();
    await expect(page.locator('button:has-text("Print this sheet")')).toBeHidden();
    await page.emulateMedia({ media: 'screen' });
  });

  test('screen media keeps the controls visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Print this sheet")')).toBeVisible();
    await expect(page.locator('.print-sheet')).toBeVisible();
  });
});

test.describe('Floor plan print — unchanged by the sheet rules', () => {
  // Section 7 of index.css piggybacks on the floor plan's global hide rule.
  // If adding .print-sheet ever broke .floor-canvas, this is where it shows.
  test('print media still reveals the floor canvas', async ({ page }) => {
    await gotoAuthenticated(page, '/app/tables/floorplan');
    await expect(page.locator('.floor-canvas')).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.floor-canvas')).toBeVisible();
    await page.emulateMedia({ media: 'screen' });
  });
});

// ─── The reminder ────────────────────────────────────────────────────────────

test.describe('Export backup reminder', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('stays quiet outside the 30-day window', async ({ page }) => {
    await gotoWithEventInDays(page, 40);
    await page.waitForTimeout(2000); // past OPEN_DELAY_MS — it must not appear
    await expect(reminderModal(page)).toBeHidden();
  });

  test('prompts with standard wording inside 30 days', async ({ page }) => {
    await gotoWithEventInDays(page, 20);
    await expect(reminderModal(page)).toBeVisible({ timeout: REMINDER_TIMEOUT });
    await expect(page.locator('text=20 days to go')).toBeVisible();
    await expect(page.locator('text=Last reminder')).toBeHidden();
    await expect(page.locator('text=Don\'t show this again for now')).toBeVisible();
  });

  test('switches to final wording at 14 days or less', async ({ page }) => {
    await gotoWithEventInDays(page, 10);
    await expect(reminderModal(page)).toBeVisible({ timeout: REMINDER_TIMEOUT });
    await expect(page.locator('text=Last reminder')).toBeVisible();
    await expect(page.locator("text=This is the last time we'll bring this up.")).toBeVisible();
  });

  test('never fires on the day itself', async ({ page }) => {
    await gotoWithEventInDays(page, 0);
    await page.waitForTimeout(2000);
    await expect(reminderModal(page)).toBeHidden();
  });

  test('never fires once the day has passed', async ({ page }) => {
    await gotoWithEventInDays(page, -3);
    await page.waitForTimeout(2000);
    await expect(reminderModal(page)).toBeHidden();
  });

  test('a plain close hides it for this session but it returns in the next', async ({ page }) => {
    await gotoWithEventInDays(page, 20);
    await expect(reminderModal(page)).toBeVisible({ timeout: REMINDER_TIMEOUT });

    await page.click('button:has-text("Close")');
    await expect(reminderModal(page)).toBeHidden();

    // Same session (sessionStorage intact) — a reload must not bring it back.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(reminderModal(page)).toBeHidden();

    // A new browser session — the nag is deliberately persistent until acted on.
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(reminderModal(page)).toBeVisible({ timeout: REMINDER_TIMEOUT });
  });

  test('"don\'t show again" snoozes for 15 days rather than opting out forever', async ({
    page,
  }) => {
    await gotoWithEventInDays(page, 20);
    await expect(reminderModal(page)).toBeVisible({ timeout: REMINDER_TIMEOUT });

    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Close")');
    await expect(reminderModal(page)).toBeHidden();

    // Survives a fresh session, unlike a plain close.
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(reminderModal(page)).toBeHidden();

    // Snoozed ~15 days out, not forever: someone who ticks at 30 days still
    // gets the final prompt at the 15-day mark.
    const snoozedUntil = await page.evaluate((eventId) => {
      const raw = localStorage.getItem('bigdays.exportReminder.v1');
      return raw ? (JSON.parse(raw)[eventId]?.snoozedUntil as number | undefined) : undefined;
    }, MOCK_EVENT_GUID);
    expect(snoozedUntil).toBeGreaterThan(Date.now() + 14 * 86_400_000);
    expect(snoozedUntil).toBeLessThan(Date.now() + 16 * 86_400_000);
  });

  test('corrupt storage fails open rather than wedging the modal shut', async ({ page }) => {
    // Seeded before the first navigation, and re-seeded on every one, so the
    // blob is already corrupt the first time getDueStage reads it.
    await page.addInitScript(() =>
      localStorage.setItem('bigdays.exportReminder.v1', '{{{not json')
    );
    await gotoWithEventInDays(page, 20);
    await expect(reminderModal(page)).toBeVisible({ timeout: REMINDER_TIMEOUT });
  });

  test('reaching the print sheet counts as acting on it', async ({ page }) => {
    await gotoWithEventInDays(page, 20);
    await expect(reminderModal(page)).toBeVisible({ timeout: REMINDER_TIMEOUT });

    await page.click('button:has-text("Print check-in sheet")');
    await expect(page).toHaveURL(/\/app\/guests\/print/);
    await expect(reminderModal(page)).toBeHidden();
  });
});
