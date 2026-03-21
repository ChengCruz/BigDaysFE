/**
 * RSVPs page tests — Stat cards, List view, Grid view, Search, Empty states,
 * CRUD modals, and API response value verification.
 */
import { test, expect } from '@playwright/test';
import {
  gotoAuthenticated,
  mockApi,
  setMockAuth,
  MOCK_RSVP,
  MOCK_EVENT_GUID,
} from './helpers';

// ── Read (list) ────────────────────────────────────────────────────────────────

test.describe('RSVPs — Read (list)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/rsvps');
  });

  test('shows "RSVPs" page heading', async ({ page }) => {
    await expect(page.locator('h2:has-text("RSVPs")')).toBeVisible();
  });

  test('shows "Total RSVPs" stat card', async ({ page }) => {
    await expect(page.locator('text=Total RSVPs')).toBeVisible();
  });

  test('shows "Total Pax" stat card', async ({ page }) => {
    await expect(page.locator('text=Total Pax')).toBeVisible();
  });

  test('Total RSVPs count matches API response (1 RSVP)', async ({ page }) => {
    // MOCK_RSVP is the single RSVP returned — stat shows 1
    const totalCard = page.locator('text=Total RSVPs').locator('..');
    await expect(totalCard.locator('text=1')).toBeVisible();
  });

  test('Total Pax count matches API response (noOfPax=3)', async ({ page }) => {
    // MOCK_RSVP.noOfPax = 3
    const paxCard = page.locator('text=Total Pax').locator('..');
    await expect(paxCard.locator(`text=${MOCK_RSVP.noOfPax}`)).toBeVisible();
  });

  test('guest name from API appears in list', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_RSVP.guestName}`).first()).toBeVisible();
  });

  test('phone number from API appears in list', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_RSVP.phoneNo}`).first()).toBeVisible();
  });

  test('pax count from API appears in list', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_RSVP.noOfPax}`).first()).toBeVisible();
  });

  test('remarks from API appears in list', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_RSVP.remarks}`).first()).toBeVisible();
  });

  test('"Design RSVP Card" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Design RSVP Card"), a:has-text("Design RSVP Card")')).toBeVisible();
  });

  test('"+ New RSVP" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("New RSVP")')).toBeVisible();
  });

  test('"Import" button is disabled with "Soon" badge', async ({ page }) => {
    const importBtn = page.locator('button:has-text("Import")');
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toBeDisabled();
  });

  test('"Export" button is disabled with "Soon" badge', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("Export")');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeDisabled();
  });

  test('search input is visible with correct placeholder', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search guests…"]')).toBeVisible();
  });

  test('list view button is visible', async ({ page }) => {
    await expect(page.locator('button[aria-label="List view"]')).toBeVisible();
  });

  test('grid view button is visible', async ({ page }) => {
    await expect(page.locator('button[aria-label="Grid view"]')).toBeVisible();
  });
});

// ── Grid view ──────────────────────────────────────────────────────────────────

test.describe('RSVPs — Grid view', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/rsvps');
  });

  test('switching to grid view shows guest card', async ({ page }) => {
    await page.click('button[aria-label="Grid view"]');
    await expect(page.locator(`text=${MOCK_RSVP.guestName}`).first()).toBeVisible();
  });

  test('grid view shows pax badge', async ({ page }) => {
    await page.click('button[aria-label="Grid view"]');
    await expect(page.locator(`text=${MOCK_RSVP.noOfPax} pax`).first()).toBeVisible();
  });
});

// ── Search filter ──────────────────────────────────────────────────────────────

test.describe('RSVPs — Search filter', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/rsvps');
  });

  test('search by guest name shows matching RSVP', async ({ page }) => {
    await page.fill('input[placeholder="Search guests…"]', MOCK_RSVP.guestName);
    await expect(page.locator(`text=${MOCK_RSVP.guestName}`).first()).toBeVisible();
  });

  test('search with no match shows "No RSVPs match your search."', async ({ page }) => {
    await page.fill('input[placeholder="Search guests…"]', 'zzz_no_match_999');
    await expect(page.locator('text=No RSVPs match your search.')).toBeVisible();
  });
});

// ── CRUD modals ────────────────────────────────────────────────────────────────

test.describe('RSVPs — New RSVP modal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/rsvps');
    await page.click('button:has-text("New RSVP")');
  });

  test('modal opens on "+ New RSVP" click', async ({ page }) => {
    await expect(page.locator('[role="dialog"], .modal, button:has-text("Cancel")').first()).toBeVisible({ timeout: 3000 });
  });

  test('"Cancel" button closes the modal', async ({ page }) => {
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible({ timeout: 3000 });
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('button:has-text("Cancel")')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('RSVPs — Edit modal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/rsvps');
  });

  test('"Edit" button is visible on each RSVP row', async ({ page }) => {
    await expect(page.locator('button:has-text("Edit")').first()).toBeVisible();
  });

  test('clicking "Edit" opens the RSVP form modal', async ({ page }) => {
    await page.locator('button:has-text("Edit")').first().click();
    await expect(page.locator('[role="dialog"], .modal, button:has-text("Cancel")').first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('RSVPs — Delete modal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/rsvps');
  });

  test('"Delete" button is visible on each RSVP row', async ({ page }) => {
    await expect(page.locator('button:has-text("Delete")').first()).toBeVisible();
  });

  test('clicking "Delete" opens confirmation modal', async ({ page }) => {
    await page.locator('button:has-text("Delete")').first().click();
    await expect(page.locator('text=Delete RSVP?')).toBeVisible({ timeout: 3000 });
  });

  test('confirmation modal shows guest name', async ({ page }) => {
    await page.locator('button:has-text("Delete")').first().click();
    await expect(page.locator('text=Delete RSVP?')).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`text=${MOCK_RSVP.guestName}`).first()).toBeVisible();
  });

  test('"Cancel" closes the delete confirmation modal', async ({ page }) => {
    await page.locator('button:has-text("Delete")').first().click();
    await expect(page.locator('text=Delete RSVP?')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Delete RSVP?')).not.toBeVisible({ timeout: 3000 });
  });
});

// ── Empty state ────────────────────────────────────────────────────────────────

test.describe('RSVPs — Empty state (no RSVPs)', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    // Override RSVPs GET to return empty list
    await page.route('**/__mock_api__/**', async route => {
      if (/\/rsvp\/GetRsvp\/List\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: [] } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await page.goto('/app/rsvps');
    await page.waitForLoadState('networkidle');
  });

  test('shows "No RSVPs yet." when list is empty', async ({ page }) => {
    await expect(page.locator('text=No RSVPs yet.')).toBeVisible();
  });

  test('Total RSVPs stat shows 0 when empty', async ({ page }) => {
    const totalCard = page.locator('text=Total RSVPs').locator('..');
    await expect(totalCard.locator('text=0')).toBeVisible();
  });

  test('Total Pax stat shows 0 when empty', async ({ page }) => {
    const paxCard = page.locator('text=Total Pax').locator('..');
    await expect(paxCard.locator('text=0')).toBeVisible();
  });
});

// ── Error state ────────────────────────────────────────────────────────────────

test.describe('RSVPs — Error state', () => {
  test('shows error message when RSVPs API fails', async ({ page }) => {
    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      if (/\/rsvp\/GetRsvp\/List\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 500, json: { isSuccess: false, message: 'Server error' } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await page.goto('/app/rsvps');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Failed to load RSVPs.')).toBeVisible({ timeout: 5000 });
  });
});

// ── No event state ─────────────────────────────────────────────────────────────

test.describe('RSVPs — No event state', () => {
  test('shows "No Events to Manage RSVPs" when no event selected', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('has_session', '1');
      localStorage.removeItem('eventId');
    });
    await page.goto('/app/rsvps');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=No Events to Manage RSVPs')).toBeVisible({ timeout: 5000 });
  });
});
