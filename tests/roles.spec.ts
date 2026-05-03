/**
 * Role-based access tests — sidebar visibility, events list filtering, and page-level functionality.
 *
 * How event filtering works:
 *   The backend filters /event/GetEventsListByUser by the JWT token — admin gets all events,
 *   member gets only their own. The frontend renders whatever the API returns with no extra
 *   role check. These tests mock the API to simulate that backend behaviour.
 *
 * Roles under test:
 *   Admin (2)  — all sidebar links, sees every member's events
 *   Member (3) — all sidebar links, sees only their own event
 *   Staff (6)  — restricted to Check-in / Guests / Tables in sidebar
 */
import { test, expect } from '@playwright/test';
import {
  gotoAuthenticated,
  gotoAuthenticatedAsMember,
  gotoAuthenticatedAsStaff,
  mockApiMultipleEvents,
  MOCK_EVENT,
  MOCK_EVENT_2,
  MOCK_USER,
  MOCK_MEMBER_USER,
  MOCK_STAFF_USER,
} from './helpers';

// ── Sidebar — Admin ───────────────────────────────────────────────────────────

test.describe('Sidebar — Admin role', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
  });

  const visibleLinks = [
    'Dashboard', 'Events', 'RSVPs', 'Guests', 'Tables', 'Wallet', 'Check-in', 'Users', 'Crew',
  ];

  for (const label of visibleLinks) {
    test(`shows "${label}" nav link`, async ({ page }) => {
      await expect(page.locator('aside nav').getByText(label, { exact: true })).toBeVisible();
    });
  }

  test('footer shows "Admin" role label', async ({ page }) => {
    await expect(page.locator('aside').getByText('Admin', { exact: true })).toBeVisible();
  });

  test('footer shows admin email', async ({ page }) => {
    await expect(page.locator('aside').getByText(MOCK_USER.email)).toBeVisible();
  });
});

// ── Sidebar — Member ──────────────────────────────────────────────────────────

test.describe('Sidebar — Member role', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedAsMember(page, '/app/events');
  });

  const visibleLinks = [
    'Dashboard', 'Events', 'RSVPs', 'Guests', 'Tables', 'Wallet', 'Check-in', 'Users', 'Crew',
  ];

  for (const label of visibleLinks) {
    test(`shows "${label}" nav link`, async ({ page }) => {
      await expect(page.locator('aside nav').getByText(label, { exact: true })).toBeVisible();
    });
  }

  test('footer shows "Member" role label', async ({ page }) => {
    await expect(page.locator('aside').getByText('Member', { exact: true })).toBeVisible();
  });

  test('footer shows member email', async ({ page }) => {
    await expect(page.locator('aside').getByText(MOCK_MEMBER_USER.email)).toBeVisible();
  });
});

// ── Sidebar — Staff ───────────────────────────────────────────────────────────

test.describe('Sidebar — Staff role', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedAsStaff(page, '/app/checkin');
  });

  const visibleLinks = ['Check-in', 'Guests', 'Tables'];
  const hiddenLinks = ['Dashboard', 'Events', 'RSVPs', 'Wallet', 'Users', 'Crew'];

  for (const label of visibleLinks) {
    test(`shows "${label}" nav link`, async ({ page }) => {
      await expect(page.locator('aside nav').getByText(label, { exact: true })).toBeVisible();
    });
  }

  for (const label of hiddenLinks) {
    test(`hides "${label}" nav link`, async ({ page }) => {
      await expect(page.locator('aside nav').getByText(label, { exact: true })).not.toBeVisible();
    });
  }

  test('footer shows "Staff" role label', async ({ page }) => {
    await expect(page.locator('aside').getByText('Staff', { exact: true })).toBeVisible();
  });

  test('footer shows staff email', async ({ page }) => {
    await expect(page.locator('aside').getByText(MOCK_STAFF_USER.email)).toBeVisible();
  });
});

// ── Events — Admin sees all member events ─────────────────────────────────────

test.describe('Events page — Admin sees all member events', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as admin, then override events mock to return multiple members' events
    await gotoAuthenticated(page, '/app/events');
    await mockApiMultipleEvents(page); // LIFO — runs before base mockApi handler
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
  });

  test('shows member 1 event', async ({ page }) => {
    await expect(page.getByText(MOCK_EVENT.eventName)).toBeVisible();
  });

  test('shows member 2 event', async ({ page }) => {
    await expect(page.getByText(MOCK_EVENT_2.eventName)).toBeVisible();
  });

  test('shows member 2 event location', async ({ page }) => {
    await expect(page.getByText(MOCK_EVENT_2.eventLocation)).toBeVisible();
  });
});

// ── Events — Member sees only their own event ─────────────────────────────────

test.describe('Events page — Member sees only their event', () => {
  test.beforeEach(async ({ page }) => {
    // Default mockApi returns [MOCK_EVENT] only — simulates backend filtering for member
    await gotoAuthenticatedAsMember(page, '/app/events');
  });

  test('shows their own event', async ({ page }) => {
    await expect(page.getByText(MOCK_EVENT.eventName)).toBeVisible();
  });

  test('does not show other members events', async ({ page }) => {
    await expect(page.getByText(MOCK_EVENT_2.eventName)).not.toBeVisible();
  });
});

// ── Users page — Admin vs Member ──────────────────────────────────────────────

test.describe('Users page — Admin', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/users');
  });

  test('shows "View All Users" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'View All Users' })).toBeVisible();
  });

  test('switching to all users shows "New User" button', async ({ page }) => {
    await page.getByRole('button', { name: 'View All Users' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'New User' })).toBeVisible();
  });
});

test.describe('Users page — Member', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedAsMember(page, '/app/users');
  });

  test('shows profile view with Change Password section', async ({ page }) => {
    await expect(page.getByText('Change Password')).toBeVisible();
  });

  test('does not show "New User" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'New User' })).not.toBeVisible();
  });

  test('does not show "View All Users" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'View All Users' })).not.toBeVisible();
  });
});
