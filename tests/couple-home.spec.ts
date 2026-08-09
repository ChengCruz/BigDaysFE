/**
 * Couple-mode Home (CoupleHomePage).
 *
 * The point of this file is the counting. Home reads the same dashboard
 * endpoint as planner mode, and every number in `tableStats` is a ROW count:
 * one Guest row is one RSVP *party*, not one person (docs/COUPLE_MODE.md).
 * The page therefore speaks in parties and never derives a head count.
 *
 * The trap it must keep avoiding: `tableStats.occupiedSeats` is assigned
 * `= assignedGuests` by the backend, so pairing it with `totalSeats` renders a
 * party count against a seat count and under-reports badly. With the mock data
 * that would read "35 of 80"; it must read "35 of 40 parties". If someone
 * "simplifies" the meter back onto occupiedSeats/totalSeats, these tests fail.
 */
import { test, expect, type Page } from '@playwright/test';
import { gotoAuthenticated, mockApi, MOCK_DASHBOARD } from './helpers';

/** Force couple mode before the app boots; UiModeContext reads it once, at mount. */
async function forceCoupleMode(page: Page) {
  await page.addInitScript(() => localStorage.setItem('uiMode', 'couple'));
}

/** Land on Home in couple mode, optionally with a patched dashboard payload. */
async function gotoCoupleHome(page: Page, dashboard?: Record<string, unknown>) {
  await forceCoupleMode(page);
  await gotoAuthenticated(page, '/app/dashboard');
  if (dashboard) {
    // Registered after mockApi, so it runs first (last-registered-first).
    await page.route('**/__mock_api__/**', async (route) => {
      if (/\/Dashboard\/Summary\//i.test(route.request().url())) {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: dashboard } });
      }
      return route.fallback();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  }
}

const nextCard = (page: Page) => page.locator('main, body').first();

test.describe('Couple Home: the day', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCoupleHome(page);
  });

  test('leads with the event and a days/hours/minutes countdown', async ({ page }) => {
    await expect(page.locator('h1:has-text("Test Wedding")')).toBeVisible();
    await expect(page.locator('text=Test Venue')).toBeVisible();

    // Three tiles, not one bare day count. MOCK_DASHBOARD's event is in 2027,
    // so this is always the future branch.
    for (const unit of ['Days', 'Hours', 'Minutes']) {
      await expect(page.getByText(unit, { exact: true })).toBeVisible();
    }
  });

  test('shows one of the preset countdown lines under the tiles', async ({ page }) => {
    // Picked at random from FAR_MSGS (the event is well over 15 days out), so
    // assert on the set rather than on one string.
    await expect(
      page.getByText(
        /Your big day is coming|Counting down to the start of your forever|A beautiful day is waiting/
      )
    ).toBeVisible();
  });

  test('shows the readiness ring from checklistStats', async ({ page }) => {
    // 9 of 15 done = 60%, 6 remaining. Both come from the dashboard payload;
    // Home must not fetch /Checklist/ByEvent to work this out.
    await expect(page.locator("text=You’re 60% ready")).toBeVisible();
    await expect(page.locator('text=6 things left before the big day.')).toBeVisible();
  });

  test('the ring links to the checklist', async ({ page }) => {
    await page.click("text=You’re 60% ready");
    await expect(page).toHaveURL(/\/app\/checklist/);
  });

  test('drops the planner quick-actions grid', async ({ page }) => {
    await expect(page.locator('text=Quick Actions')).toBeHidden();
  });

  test('shows recent activity', async ({ page }) => {
    await expect(page.locator('text=Alice Smith confirmed attendance')).toBeVisible();
  });
});

test.describe('Couple Home: counts parties, exactly as the backend does', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCoupleHome(page);
  });

  test('names the unseated parties as the next thing to do', async ({ page }) => {
    // tableStats.unassignedGuests = 5
    await expect(page.locator('text=5 parties still need a seat')).toBeVisible();
    await expect(page.locator('button:has-text("Sort the seating")')).toBeVisible();
  });

  test('meters seated parties against total parties, not seats', async ({ page }) => {
    // assignedGuests 35 / (35 + 5) = 35 of 40 parties.
    await expect(page.locator('text=35 of 40 parties seated')).toBeVisible();
  });

  test('never renders occupiedSeats against totalSeats', async ({ page }) => {
    // The mixed-unit pairing would read "35 of 80" (totalSeats = 80).
    await expect(nextCard(page)).not.toContainText('of 80');
  });

  test('labels the one genuine head count as people', async ({ page }) => {
    // rsvpStats.totalGuestsConfirmed is the backend's own SUM(NoOfPax).
    await expect(page.locator('text=People coming')).toBeVisible();
    await expect(page.locator('text=50').first()).toBeVisible();
  });

  test('counts replies as replies, separate from head count', async ({ page }) => {
    // comingCount 40 + notComingCount 5 of totalRsvpsReceived 45.
    await expect(page.locator('text=45/45')).toBeVisible();
  });

  test('seating CTA goes to the seating page', async ({ page }) => {
    await page.click('button:has-text("Sort the seating")');
    await expect(page).toHaveURL(/\/app\/tables\/v3/);
  });
});

test.describe('Couple Home: the next action changes with the data', () => {
  test('chases replies once everyone is seated', async ({ page }) => {
    await gotoCoupleHome(page, {
      ...MOCK_DASHBOARD,
      tableStats: { ...MOCK_DASHBOARD.tableStats, assignedGuests: 40, unassignedGuests: 0 },
    });
    await expect(page.locator('text=10 invites are still waiting on a reply')).toBeVisible();
    await expect(page.locator('button:has-text("See who\'s pending")')).toBeVisible();
  });

  test('flags being over budget when nothing else is outstanding', async ({ page }) => {
    await gotoCoupleHome(page, {
      ...MOCK_DASHBOARD,
      rsvpStats: { ...MOCK_DASHBOARD.rsvpStats, pendingCount: 0 },
      tableStats: { ...MOCK_DASHBOARD.tableStats, assignedGuests: 40, unassignedGuests: 0 },
      budgetStats: { ...MOCK_DASHBOARD.budgetStats, spentPercentage: 130, status: 2 },
    });
    await expect(page.locator("text=You're over budget")).toBeVisible();
  });

  test('says so when everything is done', async ({ page }) => {
    await gotoCoupleHome(page, {
      ...MOCK_DASHBOARD,
      rsvpStats: { ...MOCK_DASHBOARD.rsvpStats, pendingCount: 0 },
      tableStats: { ...MOCK_DASHBOARD.tableStats, assignedGuests: 40, unassignedGuests: 0 },
    });
    await expect(page.locator("text=Everything's on track")).toBeVisible();
  });

  test('asks for a first table when parties have replied but none exists', async ({ page }) => {
    await gotoCoupleHome(page, {
      ...MOCK_DASHBOARD,
      tableStats: {
        ...MOCK_DASHBOARD.tableStats,
        totalTables: 0,
        arrangedTables: 0,
        assignedGuests: 0,
        unassignedGuests: 6,
        totalSeats: 0,
        occupiedSeats: 0,
      },
    });
    await expect(page.locator('text=Add your first table')).toBeVisible();
    await expect(page.locator('text=6 parties have said yes')).toBeVisible();
  });

  test('asks for invites when no RSVP exists at all', async ({ page }) => {
    await gotoCoupleHome(page, {
      ...MOCK_DASHBOARD,
      rsvpStats: {
        ...MOCK_DASHBOARD.rsvpStats,
        totalRsvpsReceived: 0,
        comingCount: 0,
        notComingCount: 0,
        pendingCount: 0,
        totalGuestsConfirmed: 0,
      },
      tableStats: { ...MOCK_DASHBOARD.tableStats, assignedGuests: 0, unassignedGuests: 0 },
    });
    await expect(page.locator('text=Invite your first guests')).toBeVisible();
  });

  test('invites you to start a checklist instead of showing 0%', async ({ page }) => {
    // Nothing seeds a checklist on event creation: POST /Checklist/Seed is
    // manual, so an empty checklist is normal, not a failure state.
    await gotoCoupleHome(page, {
      ...MOCK_DASHBOARD,
      checklistStats: { totalItems: 0, completedItems: 0, remainingItems: 0, percentComplete: 0 },
    });
    await expect(page.locator('text=Start your checklist')).toBeVisible();
    await expect(page.locator('text=0% ready')).toBeHidden();
  });

  test('survives a backend that predates checklistStats', async ({ page }) => {
    // toDashboardSummary zero-fills the field, so an older API must not crash Home.
    const { checklistStats: _omitted, ...withoutChecklist } = MOCK_DASHBOARD;
    await gotoCoupleHome(page, withoutChecklist);
    await expect(page.locator('h1:has-text("Test Wedding")')).toBeVisible();
    await expect(page.locator('text=Start your checklist')).toBeVisible();
  });

  test('switches to check-in on the day itself', async ({ page }) => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
    await gotoCoupleHome(page, {
      ...MOCK_DASHBOARD,
      eventStats: { ...MOCK_DASHBOARD.eventStats, eventDate: iso },
    });
    await expect(page.locator("text=It's today").first()).toBeVisible();
    await expect(page.locator('button:has-text("Open check-in")')).toBeVisible();
  });
});

test.describe('Planner mode is untouched', () => {
  test('planner mode still gets the six-panel dashboard', async ({ page }) => {
    await mockApi(page);
    // No uiMode override; gotoAuthenticated signs in as Admin (role 2), which
    // defaults to planner.
    await gotoAuthenticated(page, '/app/dashboard');
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=parties still need a seat')).toBeHidden();
  });

  test('planner mode still gets a working help bubble', async ({ page }) => {
    await mockApi(page);
    await gotoAuthenticated(page, '/app/dashboard');

    // Mounted AND functional: a bubble that renders but no longer opens its
    // menu would pass a bare visibility check.
    const bubble = page.getByRole('button', { name: 'Open help' });
    await expect(bubble).toBeVisible();
    await bubble.click();
    await expect(page.getByText('Browse all tutorials')).toBeVisible();
  });
});

/**
 * The bubble is planner-only (routes.tsx). Couple mode swaps in Couple* pages
 * that carry no `data-tour` targets, so "Take a tour of this page" would offer
 * a tour Joyride cannot anchor, and `fixed bottom-6 right-6` sat on top of the
 * mobile tab bar's last tab.
 */
test.describe('Couple mode hides the help bubble', () => {
  test('no help bubble anywhere in couple mode', async ({ page }) => {
    await gotoCoupleHome(page);
    await expect(page.getByRole('button', { name: 'Open help' })).toHaveCount(0);
  });

  test('the Big Day tab is not covered by anything', async ({ page }) => {
    // The tab bar is `md:hidden`, so force a phone viewport regardless of which
    // project this runs under.
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoCoupleHome(page);

    // Big Day is the last of the five tabs, the one the bubble used to sit on.
    // Playwright's actionability check fails this click if another element
    // intercepts the pointer, which is exactly the regression being guarded.
    await page.getByRole('link', { name: 'Big Day' }).click();
    await expect(page).toHaveURL(/\/app\/checkin/);
  });
});
