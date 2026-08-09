/**
 * The "What's new" announcement.
 *
 * Three rules this file exists to protect:
 *
 *  1. A live release fires on the FIRST login. A brand-new browser is not a
 *     special case: if it were, the first release someone ever heard about
 *     would be the second one we shipped.
 *  2. Closing is not reading. A plain close quiets the release for this browser
 *     session only; it comes back next session. Only the "don't show this
 *     again" tick retires it for good.
 *  3. Everyone sees the same notes. Both views read one list, so the two can
 *     never tell a different story about the same release.
 *
 * Because of rule 1 the shared helpers silence the modal for every other spec
 * (see silenceWhatsNew in helpers.ts); this file opts back in.
 *
 * Content lives in src/components/whatsNew/releases.ts. The strings asserted
 * below come from the seeded entries; if you retire those entries, retarget
 * these tests rather than deleting them.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  gotoAuthenticated,
  gotoAuthenticatedAsMember,
  WHATS_NEW_OPT_IN_KEY,
} from './helpers';

const STORAGE_KEY = 'bigdays.whatsNew.v1';

/** Copy from the seeded releases. */
const ANNOUNCED_TITLE = 'A simpler view';
const FIRST_ITEM = 'Five sections: Home, Guests, Seating, Money and Big Day';
const SWITCH_ITEM = 'Switching takes one click, either way';
const QUIET_TITLE = 'Offline backups for the big day';
const INTRO_OPENING = 'You told us there was too much to look at';
const DEFAULT_INTRO = "Here's what changed since you were last here.";

const modal = (page: Page) => page.getByTestId('whats-new-modal');

/**
 * Undo the blanket silencing the shared helpers apply.
 *
 * Must be registered BEFORE the goto helper: init scripts run in registration
 * order, so this flag is already set when silenceWhatsNew checks for it, on
 * the first load and on every reload after.
 */
async function enableAnnouncements(page: Page) {
  await page.addInitScript((key) => localStorage.setItem(key, 'on'), WHATS_NEW_OPT_IN_KEY);
}

/** UiModeContext reads this once, at mount. */
async function forceMode(page: Page, mode: 'couple' | 'planner') {
  await page.addInitScript((m) => localStorage.setItem('uiMode', m), mode);
}

async function readState(page: Page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as { firstSeenAt: number; seen: string[] }) : null;
  }, STORAGE_KEY);
}

/**
 * Simulate closing the browser and coming back: sessionStorage goes, the
 * localStorage record survives. A plain close must not outlive this.
 */
async function startNewSession(page: Page) {
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe("What's new: announcement modal", () => {
  test('fires on a first-ever login, with nothing in storage', async ({ page }) => {
    await enableAnnouncements(page);
    await gotoAuthenticated(page, '/app/dashboard');

    // Nothing has ever been written for this browser…
    expect(await readState(page)).toBeNull();

    // …and the announcement still arrives.
    await expect(modal(page)).toBeVisible({ timeout: 6000 });
    // Exact, since the intro sentence also contains the phrase "a simpler view".
    await expect(modal(page).getByText(ANNOUNCED_TITLE, { exact: true })).toBeVisible();
    await expect(modal(page).getByText(FIRST_ITEM)).toBeVisible();
  });

  test('never mentions a quiet release', async ({ page }) => {
    await enableAnnouncements(page);
    await gotoAuthenticated(page, '/app/dashboard');

    await expect(modal(page)).toBeVisible({ timeout: 6000 });
    await expect(modal(page).getByText(QUIET_TITLE)).toBeHidden();
  });

  test('a plain close holds for the rest of the session', async ({ page }) => {
    await enableAnnouncements(page);
    await gotoAuthenticated(page, '/app/dashboard');

    await expect(modal(page)).toBeVisible({ timeout: 6000 });
    await modal(page).getByRole('button', { name: 'Got it' }).click();
    await expect(modal(page)).toBeHidden();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
    await expect(modal(page)).toBeHidden();

    // …and nothing was permanently retired by that close.
    const state = await readState(page);
    expect(state?.seen ?? []).not.toContain('2026-08-simple-view');
  });

  test('comes back next session when the tick is left unchecked', async ({ page }) => {
    await enableAnnouncements(page);
    await gotoAuthenticated(page, '/app/dashboard');

    await expect(modal(page)).toBeVisible({ timeout: 6000 });
    await modal(page).getByRole('button', { name: 'Got it' }).click();
    await expect(modal(page)).toBeHidden();

    await startNewSession(page);
    await expect(modal(page)).toBeVisible({ timeout: 6000 });
  });

  test('"don\'t show this again" retires it for good', async ({ page }) => {
    await enableAnnouncements(page);
    await gotoAuthenticated(page, '/app/dashboard');

    await expect(modal(page)).toBeVisible({ timeout: 6000 });
    await modal(page).getByRole('checkbox', { name: "Don't show this again" }).check();
    await modal(page).getByRole('button', { name: 'Got it' }).click();
    await expect(modal(page)).toBeHidden();

    await startNewSession(page);
    await page.waitForTimeout(2500);
    await expect(modal(page)).toBeHidden();

    const state = await readState(page);
    expect(state?.seen).toContain('2026-08-simple-view');
  });

  test("shows the release's own intro instead of the stock line", async ({ page }) => {
    await enableAnnouncements(page);
    await gotoAuthenticated(page, '/app/dashboard');

    await expect(modal(page)).toBeVisible({ timeout: 6000 });
    await expect(modal(page).getByText(INTRO_OPENING)).toBeVisible();
    await expect(modal(page).getByText(DEFAULT_INTRO)).toBeHidden();
  });

  test('is a read-only list, with no per-item navigation', async ({ page }) => {
    await enableAnnouncements(page);
    await gotoAuthenticated(page, '/app/dashboard');

    await expect(modal(page)).toBeVisible({ timeout: 6000 });
    // The rows are text, not links. Only the modal's own controls act.
    await expect(modal(page).getByRole('button', { name: 'Show me' })).toHaveCount(0);
    await expect(modal(page).getByTestId('whats-new-item').first()).toBeVisible();
  });
});

test.describe("What's new: same notes in both views", () => {
  /**
   * There is no per-view filtering, and this is what stops it creeping back:
   * both views must show the same rows, in the same order, for the same release.
   */
  const EXPECTED_ROWS = [FIRST_ITEM, SWITCH_ITEM];

  test('the advanced view shows every row', async ({ page }) => {
    await enableAnnouncements(page);
    await forceMode(page, 'planner');
    await gotoAuthenticated(page, '/app/dashboard');

    await expect(modal(page)).toBeVisible({ timeout: 6000 });
    await expect(modal(page).getByTestId('whats-new-item')).toHaveCount(EXPECTED_ROWS.length);
    for (const row of EXPECTED_ROWS) {
      await expect(modal(page).getByText(row)).toBeVisible();
    }
  });

  test('the simple view shows exactly the same rows', async ({ page }) => {
    await enableAnnouncements(page);
    await forceMode(page, 'couple');
    await gotoAuthenticatedAsMember(page, '/app/dashboard');

    await expect(modal(page)).toBeVisible({ timeout: 6000 });
    await expect(modal(page).getByTestId('whats-new-item')).toHaveCount(EXPECTED_ROWS.length);
    for (const row of EXPECTED_ROWS) {
      await expect(modal(page).getByText(row)).toBeVisible();
    }
  });
});

test.describe("What's new: history page", () => {
  test('lists quiet releases alongside announced ones', async ({ page }) => {
    await gotoAuthenticated(page, '/app/whats-new');

    const releases = page.getByTestId('whats-new-release');
    await expect(releases).toHaveCount(2);
    await expect(page.getByRole('heading', { name: ANNOUNCED_TITLE })).toBeVisible();
    await expect(page.getByRole('heading', { name: QUIET_TITLE })).toBeVisible();

    // The intro carries over from the modal; a release without one shows no
    // stand-in sentence on a card.
    await expect(page.getByText(INTRO_OPENING)).toBeVisible();
    await expect(page.getByText(DEFAULT_INTRO)).toBeHidden();
  });

  test('marks everything read, clearing the sidebar dot', async ({ page }) => {
    await enableAnnouncements(page);
    await gotoAuthenticated(page, '/app/whats-new');

    await expect(page.getByTestId('whats-new-release').first()).toBeVisible();
    const state = await readState(page);
    expect(state?.seen).toEqual(
      expect.arrayContaining(['2026-08-simple-view', '2026-07-offline-backup'])
    );
  });

  test('is reachable from the planner sidebar footer', async ({ page }) => {
    await gotoAuthenticated(page, '/app/dashboard');

    // Below Tailwind's `md` the rail is an off-canvas drawer, so open it first,
    // or the link sits outside the viewport. Checking the width rather than the
    // toggle's visibility keeps this free of hydration races.
    if ((page.viewportSize()?.width ?? 0) < 768) {
      await page.getByRole('button', { name: 'Toggle sidebar' }).click();
    }

    const link = page.getByRole('link', { name: "What's new" });
    await expect(link).toBeInViewport();
    await link.click();
    await expect(page).toHaveURL(/\/app\/whats-new/);
    await expect(page.getByRole('heading', { name: "What's new" })).toBeVisible();
  });

  test('is reachable from the couple rail footer', async ({ page }) => {
    await forceMode(page, 'couple');
    await gotoAuthenticatedAsMember(page, '/app/dashboard');

    if ((page.viewportSize()?.width ?? 0) < 768) {
      // The rail is desktop-only in couple mode, so mobile goes via the avatar
      // menu. Its trigger is a plain span with an aria-label, not a button.
      await page.getByLabel('Account').click();
      await page.getByRole('button', { name: /What's new/ }).click();
    } else {
      await page.getByRole('link', { name: "What's new" }).click();
    }

    await expect(page).toHaveURL(/\/app\/whats-new/);
    await expect(page.getByRole('heading', { name: "What's new" })).toBeVisible();
  });
});
