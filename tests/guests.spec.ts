/**
 * Guests page tests — Read, Filter, Edit, Assign/Unassign, Empty states.
 */
import { test, expect } from '@playwright/test';
import {
  gotoAuthenticated,
  mockApi,
  setMockAuth,
  MOCK_GUEST,
  MOCK_GUEST_ASSIGNED,
  MOCK_TABLE,
} from './helpers';

test.describe('Guests — Read (list)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/guests');
  });

  test('shows page heading "Guests"', async ({ page }) => {
    await expect(page.locator('h2:has-text("Guests")')).toBeVisible();
  });

  test('renders stats cards: Total Guests, Assigned, Unassigned, VIPs', async ({ page }) => {
    await expect(page.locator('text=Total Guests')).toBeVisible();
    await expect(page.locator('text=Assigned')).toBeVisible();
    await expect(page.locator('text=Unassigned')).toBeVisible();
    await expect(page.locator('text=VIPs')).toBeVisible();
  });

  test('renders unassigned guest card with name', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_GUEST.name}`).first()).toBeVisible();
  });

  test('renders assigned guest card with name', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_GUEST_ASSIGNED.name}`).first()).toBeVisible();
  });

  test('unassigned guest shows "UNASSIGNED" badge', async ({ page }) => {
    const guestCard = page.locator('li').filter({ hasText: MOCK_GUEST.name });
    await expect(guestCard.locator('text=UNASSIGNED')).toBeVisible();
  });

  test('assigned guest shows "ASSIGNED" badge', async ({ page }) => {
    const guestCard = page.locator('li').filter({ hasText: MOCK_GUEST_ASSIGNED.name });
    await expect(guestCard.locator('text=ASSIGNED')).toBeVisible();
  });

  test('assigned guest shows table name', async ({ page }) => {
    const guestCard = page.locator('li').filter({ hasText: MOCK_GUEST_ASSIGNED.name });
    await expect(guestCard.locator(`text=${MOCK_TABLE.tableName}`)).toBeVisible();
  });

  test('unassigned guest shows "No table assigned"', async ({ page }) => {
    const guestCard = page.locator('li').filter({ hasText: MOCK_GUEST.name });
    await expect(guestCard.locator('text=No table assigned')).toBeVisible();
  });

  test('unassigned guest shows "Assign Table" button', async ({ page }) => {
    const guestCard = page.locator('li').filter({ hasText: MOCK_GUEST.name });
    await expect(guestCard.locator('button:has-text("Assign Table")')).toBeVisible();
  });

  test('assigned guest shows "Unassign" button', async ({ page }) => {
    const guestCard = page.locator('li').filter({ hasText: MOCK_GUEST_ASSIGNED.name });
    await expect(guestCard.locator('button:has-text("Unassign")')).toBeVisible();
  });

  test('shows note about guests being created from RSVP submissions', async ({ page }) => {
    await expect(page.locator('text=Guests are automatically created')).toBeVisible();
  });
});

test.describe('Guests — Filters', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/guests');
  });

  test('guest type dropdown is visible and has expected options', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    for (const opt of ['All', 'Family', 'VIP', 'Friend', 'Other']) {
      await expect(select.locator(`option:has-text("${opt}")`)).toHaveCount(1);
    }
  });

  test('search input is visible and accepts input', async ({ page }) => {
    const search = page.locator('input[placeholder="Search guests by name..."]');
    await expect(search).toBeVisible();
    await search.fill('Alice');
    await expect(search).toHaveValue('Alice');
  });

  test('filtering by VIP hides non-VIP guests', async ({ page }) => {
    await page.selectOption('select', 'VIP');
    // MOCK_GUEST_ASSIGNED has flag='VIP', MOCK_GUEST has flag='Family'
    await expect(page.locator(`text=${MOCK_GUEST_ASSIGNED.name}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_GUEST.name}`)).not.toBeVisible();
  });

  test('filtering by Family hides non-Family guests', async ({ page }) => {
    await page.selectOption('select', 'Family');
    await expect(page.locator(`text=${MOCK_GUEST.name}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_GUEST_ASSIGNED.name}`)).not.toBeVisible();
  });

  test('search filters guests by name', async ({ page }) => {
    await page.fill('input[placeholder="Search guests by name..."]', MOCK_GUEST.name);
    await expect(page.locator(`text=${MOCK_GUEST.name}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_GUEST_ASSIGNED.name}`)).not.toBeVisible();
  });

  test('filter with no match shows "No guests match your filters"', async ({ page }) => {
    await page.fill('input[placeholder="Search guests by name..."]', 'zzz_no_match_zzz');
    await expect(page.locator('text=No guests match your filters')).toBeVisible();
  });
});

test.describe('Guests — Edit modal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/guests');
  });

  test('"Edit" button is visible on each guest card', async ({ page }) => {
    await expect(page.locator('button:has-text("Edit")').first()).toBeVisible();
  });

  test('clicking "Edit" opens the guest form modal', async ({ page }) => {
    await page.locator('button:has-text("Edit")').first().click();
    // Modal should appear — look for a close/cancel action or modal container
    await expect(page.locator('[role="dialog"], .modal, button:has-text("Cancel")').first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Guests — Assign Table modal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/guests');
  });

  test('clicking "Assign Table" opens assign modal with table listed', async ({ page }) => {
    const guestCard = page.locator('li').filter({ hasText: MOCK_GUEST.name });
    await guestCard.locator('button:has-text("Assign Table")').click();
    await expect(page.locator(`text=Assign ${MOCK_GUEST.name} to Table`)).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`text=${MOCK_TABLE.tableName}`)).toBeVisible();
  });

  test('"Cancel" closes the assign modal', async ({ page }) => {
    const guestCard = page.locator('li').filter({ hasText: MOCK_GUEST.name });
    await guestCard.locator('button:has-text("Assign Table")').click();
    await expect(page.locator(`text=Assign ${MOCK_GUEST.name} to Table`)).toBeVisible({ timeout: 3000 });
    await page.click('button:has-text("Cancel")');
    await expect(page.locator(`text=Assign ${MOCK_GUEST.name} to Table`)).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Guests — Empty state (no guests)', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    // Override guests GET to return empty list
    await page.route('**/__mock_api__/**', async route => {
      if (/\/Guest\/ByEvent\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: [] } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/guests');
    await page.waitForLoadState('networkidle');
  });

  test('shows "No guests yet" message when list is empty', async ({ page }) => {
    await expect(page.locator('text=No guests yet. Create your first guest!')).toBeVisible();
  });
});

test.describe('Guests — No event selected', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    // Set session but NO eventId
    await page.evaluate(() => {
      localStorage.setItem('has_session', '1');
      localStorage.removeItem('eventId');
    });
    await page.goto('/app/guests');
    await page.waitForLoadState('networkidle');
  });

  test('shows "No Events" state when no event is selected', async ({ page }) => {
    await expect(page.locator('text=No Events for Guest Management')).toBeVisible({ timeout: 5000 });
  });
});
