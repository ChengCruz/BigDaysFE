/**
 * Dashboard page tests — quick actions navigation and page rendering.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockApi, setMockAuth, MOCK_DASHBOARD } from './helpers';

test.describe('Dashboard — rendering', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/dashboard');
  });

  test('shows event name in spotlight', async ({ page }) => {
    await expect(page.locator('text=Test Wedding')).toBeVisible();
  });

  test('shows Quick Actions section', async ({ page }) => {
    await expect(page.locator('text=Quick Actions')).toBeVisible();
  });

  test('shows Recent Activity section', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('shows RSVP stats card', async ({ page }) => {
    await expect(page.locator('text=RSVP Status')).toBeVisible();
  });

  test('shows Budget stats card', async ({ page }) => {
    await expect(page.locator('text=Budget')).toBeVisible();
  });

  test('shows Seating Progress card', async ({ page }) => {
    await expect(page.locator('text=Seating Progress')).toBeVisible();
  });

  // ── API value verification ──────────────────────────────────────────────────

  test('RSVP total count matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.rsvpStats.totalRsvpsReceived = 45
    await expect(page.locator(`text=${MOCK_DASHBOARD.rsvpStats.totalRsvpsReceived}`).first()).toBeVisible();
  });

  test('RSVP coming count matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.rsvpStats.comingCount = 40
    await expect(page.locator(`text=${MOCK_DASHBOARD.rsvpStats.comingCount}`).first()).toBeVisible();
  });

  test('RSVP not-coming count matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.rsvpStats.notComingCount = 5
    await expect(page.locator(`text=${MOCK_DASHBOARD.rsvpStats.notComingCount}`).first()).toBeVisible();
  });

  test('total budget value matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.budgetStats.totalBudget = 50000 → displayed as "50,000"
    await expect(page.locator('text=/50[,.]?000/').first()).toBeVisible();
  });

  test('spent amount matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.budgetStats.spentAmount = 12500 → displayed as "12,500"
    await expect(page.locator('text=/12[,.]?500/').first()).toBeVisible();
  });

  test('total tables count matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.tableStats.totalTables = 10
    await expect(page.locator(`text=${MOCK_DASHBOARD.tableStats.totalTables}`).first()).toBeVisible();
  });

  test('recent activity entry matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.recentActivity[0].description = 'Alice Smith confirmed attendance'
    await expect(page.locator(`text=${MOCK_DASHBOARD.recentActivity[0].description}`).first()).toBeVisible();
  });

  test('event name in spotlight matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.eventStats.eventName = 'Test Wedding'
    await expect(page.locator(`text=${MOCK_DASHBOARD.eventStats.eventName}`).first()).toBeVisible();
  });

  test('event location in spotlight matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.eventStats.eventLocation = 'Test Venue'
    await expect(page.locator(`text=${MOCK_DASHBOARD.eventStats.eventLocation}`).first()).toBeVisible();
  });

  test('RSVP card shows "/ 50 responded" from API totalGuestsConfirmed', async ({ page }) => {
    // MOCK_DASHBOARD.rsvpStats.totalGuestsConfirmed = 50
    await expect(page.locator(`text=/ ${MOCK_DASHBOARD.rsvpStats.totalGuestsConfirmed} responded`).first()).toBeVisible();
  });

  test('RSVP card shows coming count with "guests" label', async ({ page }) => {
    // MOCK_DASHBOARD.rsvpStats.comingCount = 40 → "40 guests"
    await expect(page.locator(`text=${MOCK_DASHBOARD.rsvpStats.comingCount} guests`).first()).toBeVisible();
  });

  test('RSVP card shows not-coming count with "guests" label', async ({ page }) => {
    // MOCK_DASHBOARD.rsvpStats.notComingCount = 5 → "5 guests"
    await expect(page.locator(`text=${MOCK_DASHBOARD.rsvpStats.notComingCount} guests`).first()).toBeVisible();
  });

  test('Budget card shows spent percentage badge from API', async ({ page }) => {
    // MOCK_DASHBOARD.budgetStats.spentPercentage = 25 → "25%"
    await expect(page.locator(`text=${MOCK_DASHBOARD.budgetStats.spentPercentage}%`).first()).toBeVisible();
  });

  test('Seating card shows "guests seated" ratio from API', async ({ page }) => {
    // assignedGuests=35, totalSeats=80 → "35 / 80"
    await expect(page.locator(`text=${MOCK_DASHBOARD.tableStats.assignedGuests} / ${MOCK_DASHBOARD.tableStats.totalSeats}`).first()).toBeVisible();
  });

  test('Seating card shows "tables arranged" ratio from API', async ({ page }) => {
    // arrangedTables=8, totalTables=10 → "8 / 10"
    await expect(page.locator(`text=${MOCK_DASHBOARD.tableStats.arrangedTables} / ${MOCK_DASHBOARD.tableStats.totalTables}`).first()).toBeVisible();
  });

  test('recent activity details sub-text matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.recentActivity[0].details = 'Coming with 2 guests'
    await expect(page.locator(`text=${MOCK_DASHBOARD.recentActivity[0].details}`).first()).toBeVisible();
  });

  test('recent activity icon matches API response', async ({ page }) => {
    // MOCK_DASHBOARD.recentActivity[0].icon = '✅'
    await expect(page.locator(`text=${MOCK_DASHBOARD.recentActivity[0].icon}`).first()).toBeVisible();
  });

  test('countdown shows "Days", "Hours", "Minutes" labels', async ({ page }) => {
    // MOCK_DASHBOARD.eventStats.eventDate = '2027-12-01' (future) → countdown visible
    await expect(page.locator('text=Days')).toBeVisible();
    await expect(page.locator('text=Hours')).toBeVisible();
    await expect(page.locator('text=Minutes')).toBeVisible();
  });

  test('"Send Invites" quick action is disabled', async ({ page }) => {
    const btn = page.locator('button:has-text("Send Invites")');
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });
});

test.describe('Dashboard — quick actions navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/dashboard');
  });

  test('"Add RSVP" navigates to /app/rsvps', async ({ page }) => {
    await page.locator('button:has-text("Add RSVP")').click();
    await expect(page).toHaveURL(/\/app\/rsvps/);
  });

  test('"Design RSVP" navigates to /app/rsvps/designer', async ({ page }) => {
    await page.locator('button:has-text("Design RSVP")').click();
    await expect(page).toHaveURL(/\/app\/rsvps\/designer/);
  });

  test('"Arrange Seats" navigates to /app/tables', async ({ page }) => {
    await page.locator('button:has-text("Arrange Seats")').click();
    await expect(page).toHaveURL(/\/app\/tables/);
  });

  test('"Add Expense" navigates to /app/wallet', async ({ page }) => {
    await page.locator('button:has-text("Add Expense")').click();
    await expect(page).toHaveURL(/\/app\/wallet/);
  });
});

test.describe('Dashboard — stat card navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/dashboard');
  });

  test('"View RSVPs" navigates to /app/rsvps', async ({ page }) => {
    await page.locator('button:has-text("View RSVPs")').click();
    await expect(page).toHaveURL(/\/app\/rsvps/);
  });

  test('"Manage Budget" navigates to /app/wallet', async ({ page }) => {
    await page.locator('button:has-text("Manage Budget")').click();
    await expect(page).toHaveURL(/\/app\/wallet/);
  });

  test('"Manage Tables" navigates to /app/tables', async ({ page }) => {
    await page.locator('button:has-text("Manage Tables")').click();
    await expect(page).toHaveURL(/\/app\/tables/);
  });
});

test.describe('Dashboard — no activity state', () => {
  test('shows "No activity yet" when recentActivity is empty', async ({ page }) => {
    await mockApi(page);
    // Override Dashboard Summary to return empty recentActivity
    await page.route('**/__mock_api__/**', async route => {
      if (/\/Dashboard\/Summary\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          json: {
            isSuccess: true,
            data: {
              eventStats: MOCK_DASHBOARD.eventStats,
              rsvpStats: MOCK_DASHBOARD.rsvpStats,
              tableStats: MOCK_DASHBOARD.tableStats,
              budgetStats: MOCK_DASHBOARD.budgetStats,
              recentActivity: [],
            },
          },
        });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=No activity yet')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard — no event selected', () => {
  test('shows welcome prompt when no event is set', async ({ page }) => {
    await gotoAuthenticated(page, '/app/dashboard');
    await page.evaluate(() => localStorage.removeItem('eventId'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Welcome to MyBigDays!')).toBeVisible();
  });

  test('"Create Your First Event" navigates to /app/events?new=1', async ({ page }) => {
    await gotoAuthenticated(page, '/app/dashboard');
    await page.evaluate(() => localStorage.removeItem('eventId'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Create Your First Event")').click();
    await expect(page).toHaveURL(/\/app\/events\?new=1/);
  });
});
