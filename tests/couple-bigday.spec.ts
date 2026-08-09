/**
 * Couple-mode Big Day (CoupleBigDayPage).
 *
 * The point of this file is reachability. `coupleSections.ts` maps /app/crew to
 * the Big Day tab, but the tab navigates to /app/checkin, so the helpers row on
 * this page is the ONLY path to crew in couple mode (docs/COUPLE_MODE.md). It
 * used to be a rail-footer link; these tests hold both halves of that move.
 *
 * If someone drops the row, test 4 fails. If someone re-adds the footer link
 * without removing the row, test 5 fails.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  gotoAuthenticated,
  gotoAuthenticatedAsMember,
  gotoAuthenticatedAsStaff,
  MOCK_EVENT_GUID,
} from './helpers';

const CREW = [
  { crewGuid: 'crew-1', crewCode: 'C01', name: 'Aunty Chan', isActive: true, eventGuid: MOCK_EVENT_GUID },
  { crewGuid: 'crew-2', crewCode: 'C02', name: 'Wei Ming', isActive: true, eventGuid: MOCK_EVENT_GUID },
  { crewGuid: 'crew-3', crewCode: 'C03', name: 'Priya', isActive: false, eventGuid: MOCK_EVENT_GUID },
];

/** Force couple mode before the app boots; UiModeContext reads it once, at mount. */
async function forceCoupleMode(page: Page) {
  await page.addInitScript(() => localStorage.setItem('uiMode', 'couple'));
}

/** Registered after mockApi, so it runs first (last-registered-first). */
async function mockCrew(page: Page, crew: typeof CREW | []) {
  await page.route('**/__mock_api__/**', async (route) => {
    if (/\/Crew\/ByEvent\//i.test(route.request().url())) {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: crew } });
    }
    return route.fallback();
  });
}

const helpersRow = (page: Page) => page.getByRole('link', { name: /Your helpers/i });

test.describe('Couple mode: Big Day', () => {
  test('shows the helpers row above the scanner, counting only active helpers', async ({ page }) => {
    await forceCoupleMode(page);
    await gotoAuthenticatedAsMember(page, '/app/checkin');
    await mockCrew(page, CREW);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const row = helpersRow(page);
    await expect(row).toBeVisible();
    // 3 helpers, 1 switched off.
    await expect(row).toContainText('2 people can scan guests in on the day');
    await expect(row).toContainText('Manage');

    // The scanner itself is still CheckInPage, rendered unchanged below the row.
    await expect(page.getByRole('heading', { name: 'Guest Check-in' })).toBeVisible();
  });

  test('says so plainly when there are no helpers', async ({ page }) => {
    await forceCoupleMode(page);
    await gotoAuthenticatedAsMember(page, '/app/checkin');

    const row = helpersRow(page);
    await expect(row).toBeVisible();
    await expect(row).toContainText("you'll be checking guests in on your own");
    await expect(row).toContainText('Add helpers');
  });

  test('the row is the way into /app/crew', async ({ page }) => {
    await forceCoupleMode(page);
    await gotoAuthenticatedAsMember(page, '/app/checkin');

    await helpersRow(page).click();
    await page.waitForURL(/\/app\/crew/);
    await expect(page.getByRole('heading', { name: 'Crew' })).toBeVisible();
  });

  test('the shell no longer offers helpers, so the row is the only path', async ({ page }) => {
    await forceCoupleMode(page);
    await gotoAuthenticatedAsMember(page, '/app/dashboard');

    // Rail footer (desktop) and everything else on Home.
    await expect(page.locator('a[href="/app/crew"]')).toHaveCount(0);
    await expect(page.getByText('Your helpers')).toHaveCount(0);

    // Avatar menu: the mobile mirror of the rail footer.
    await page.getByLabel('Account').click();
    await expect(page.getByRole('button', { name: 'Your account' })).toBeVisible();
    await expect(page.getByText('Your helpers')).toHaveCount(0);
  });

  test('planner mode gets the bare scanner', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('uiMode', 'planner'));
    await gotoAuthenticated(page, '/app/checkin');

    await expect(page.getByRole('heading', { name: 'Guest Check-in' })).toBeVisible();
    await expect(helpersRow(page)).toHaveCount(0);
  });

  test('crew never sees the helper list, even with couple mode saved locally', async ({ page }) => {
    // A helper signing in on the couple's own browser inherits uiMode=couple.
    await forceCoupleMode(page);
    // EventContext scopes crew to the guid stashed at crew login (sessionStorage,
    // not the localStorage eventId everyone else uses). Without it CheckInPage
    // renders NoEventsState and the row would be hidden for the wrong reason.
    await page.addInitScript(
      (guid) => sessionStorage.setItem('crew_event_guid', guid),
      MOCK_EVENT_GUID
    );
    await gotoAuthenticatedAsStaff(page, '/app/checkin');

    await expect(page.getByRole('heading', { name: 'Guest Check-in' })).toBeVisible();
    await expect(helpersRow(page)).toHaveCount(0);
  });
});
