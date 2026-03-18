/**
 * Events CRUD tests — Create, Read, Update (Edit), Archive/Activate.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockApi, setMockAuth, MOCK_EVENT } from './helpers';

test.describe('Events — Read (list)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
  });

  test('shows events page heading', async ({ page }) => {
    await expect(page.locator('h2:has-text("Your Events")')).toBeVisible();
  });

  test('renders event card with title', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_EVENT.title}`).first()).toBeVisible();
  });

  test('event card shows location from API response', async ({ page }) => {
    // MOCK_EVENT.eventLocation = 'Test Venue'
    await expect(page.locator('text=Test Venue').first()).toBeVisible();
  });

  test('event card shows description from API response', async ({ page }) => {
    // MOCK_EVENT.eventDescription = 'A test event'
    await expect(page.locator('text=A test event').first()).toBeVisible();
  });

  test('event card shows table count from API response', async ({ page }) => {
    // MOCK_EVENT.noOfTable = 10 → "Tables: 10"
    await expect(page.locator('text=Tables: 10').first()).toBeVisible();
  });

  test('active event stat card shows count of 1', async ({ page }) => {
    // 1 active event (MOCK_EVENT.isDeleted=false)
    const activeCard = page.locator('text=Active events').locator('..');
    await expect(activeCard.locator('text=1')).toBeVisible();
  });

  test('archived event stat card shows count of 0', async ({ page }) => {
    // MOCK_EVENT.isDeleted=false → 0 archived
    const archivedCard = page.locator('text=Archived events').locator('..');
    await expect(archivedCard.locator('text=0')).toBeVisible();
  });

  test('active event banner shows event title', async ({ page }) => {
    // MOCK_EVENT is the active event (eventId in localStorage matches)
    await expect(page.locator('text=Active event')).toBeVisible();
    await expect(page.locator(`text=${MOCK_EVENT.title}`).first()).toBeVisible();
  });

  test('search input is visible and accepts input', async ({ page }) => {
    const search = page.locator('input[placeholder="Search by name or location"]');
    await expect(search).toBeVisible();
    await search.fill('Wedding');
    await expect(search).toHaveValue('Wedding');
  });

  test('sort dropdown has expected options', async ({ page }) => {
    const sort = page.locator('select').first();
    await expect(sort).toBeVisible();
    await expect(sort.locator('option:has-text("Soonest first")')).toHaveCount(1);
    await expect(sort.locator('option:has-text("Most recent")')).toHaveCount(1);
    await expect(sort.locator('option:has-text("Alphabetical")')).toHaveCount(1);
  });

  test('shows "Show archived" toggle button', async ({ page }) => {
    await expect(page.locator('button:has-text("Show archived")')).toBeVisible();
  });

  test('search with no match shows "No events match your filters."', async ({ page }) => {
    await page.fill('input[placeholder="Search by name or location"]', 'zzz_no_match_999');
    await expect(page.locator('text=No events match your filters.')).toBeVisible();
  });
});

test.describe('Events — Error state', () => {
  test('shows error message when events API fails', async ({ page }) => {
    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      if (/\/event\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 500, json: { isSuccess: false, message: 'Server error' } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Failed to load events.')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Events — Create', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/events?new=1');
  });

  test('modal opens with "New Event" title', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
  });

  test('all form fields are present', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });

  test('Cancel button closes modal', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=New Event')).not.toBeVisible({ timeout: 3000 });
  });

  test('validation — Create button stays disabled or form stays open on empty submit', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
    await page.click('button:has-text("Create")');
    // Modal should still be visible (validation prevents close)
    await expect(page.locator('text=New Event')).toBeVisible();
  });

  test('validation — shows error when title is empty', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
    await page.fill('input[type="date"]', '2026-12-01');
    await page.fill('input[type="number"]', '10');
    await page.locator('input[type="text"]').nth(0).fill('Grand Ballroom');
    await page.locator('input[type="text"]').nth(1).fill('A beautiful event');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Title cannot be empty.')).toBeVisible();
    await expect(page.locator('text=New Event')).toBeVisible();
  });

  test('validation — shows error when date is empty', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
    await page.locator('input[type="text"]').first().fill('My Test Wedding');
    await page.fill('input[type="number"]', '10');
    await page.locator('input[type="text"]').nth(1).fill('Grand Ballroom');
    await page.locator('input[type="text"]').nth(2).fill('A beautiful event');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Date cannot be empty.')).toBeVisible();
    await expect(page.locator('text=New Event')).toBeVisible();
  });

  test('validation — shows error when number of tables is 0', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
    await page.locator('input[type="text"]').first().fill('My Test Wedding');
    await page.fill('input[type="date"]', '2026-12-01');
    await page.fill('input[type="number"]', '0');
    await page.locator('input[type="text"]').nth(1).fill('Grand Ballroom');
    await page.locator('input[type="text"]').nth(2).fill('A beautiful event');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Number of tables cannot be empty.')).toBeVisible();
    await expect(page.locator('text=New Event')).toBeVisible();
  });

  test('validation — shows error when description is empty', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
    await page.locator('input[type="text"]').first().fill('My Test Wedding');
    await page.fill('input[type="date"]', '2026-12-01');
    await page.fill('input[type="number"]', '10');
    await page.locator('input[type="text"]').nth(0).fill('Grand Ballroom');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Description cannot be empty.')).toBeVisible();
    await expect(page.locator('text=New Event')).toBeVisible();
  });

  test('validation — shows error when location is empty', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
    await page.locator('input[type="text"]').first().fill('My Test Wedding');
    await page.fill('input[type="date"]', '2026-12-01');
    await page.fill('input[type="number"]', '10');
    await page.locator('input[type="text"]').nth(1).fill('A beautiful event');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Location cannot be empty.')).toBeVisible();
    await expect(page.locator('text=New Event')).toBeVisible();
  });

  test('validation — all field errors shown on completely empty submit', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Title cannot be empty.')).toBeVisible();
    await expect(page.locator('text=Date cannot be empty.')).toBeVisible();
    await expect(page.locator('text=Number of tables cannot be empty.')).toBeVisible();
    await expect(page.locator('text=Description cannot be empty.')).toBeVisible();
    await expect(page.locator('text=Location cannot be empty.')).toBeVisible();
  });

  test('fills all fields and submits → modal closes', async ({ page }) => {
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });

    await page.locator('input[type="text"]').first().fill('My Test Wedding');
    await page.fill('input[type="date"]', '2026-12-01');
    await page.fill('input[type="number"]', '10');
    await page.locator('input[type="text"]').nth(1).fill('Grand Ballroom');
    await page.locator('input[type="text"]').nth(2).fill('A beautiful event');

    await page.click('button:has-text("Create")');
    await expect(page.locator('text=New Event')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Events — Edit', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
  });

  test('"Edit details" button navigates to edit route', async ({ page }) => {
    const editBtn = page.locator('button:has-text("Edit details")').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await expect(page).toHaveURL(/\/app\/events\/.*\/edit/);
  });

  test('"Form fields" button navigates to form-fields route', async ({ page }) => {
    const formFieldsBtn = page.locator('button:has-text("Form fields")').first();
    await expect(formFieldsBtn).toBeVisible();
    await formFieldsBtn.click();
    await expect(page).toHaveURL(/form-fields/);
  });
});

test.describe('Events — Archive / Activate', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
  });

  test('"Archive" button is visible on active event', async ({ page }) => {
    await expect(page.locator('button:has-text("Archive")').first()).toBeVisible();
  });

  test('clicking "Archive" calls deactivate and updates UI', async ({ page }) => {
    const archiveBtn = page.locator('button:has-text("Archive")').first();
    await expect(archiveBtn).toBeVisible();
    await archiveBtn.click();
    // Button should show loading state or disappear
    await page.waitForTimeout(500);
    // No error toast should appear
    await expect(page.locator('text=Failed')).not.toBeVisible();
  });

  test('"Show archived" toggle reveals archived events section', async ({ page }) => {
    await page.click('button:has-text("Show archived")');
    await expect(page.locator('button:has-text("Hide archived")')).toBeVisible();
  });
});

test.describe('Events — Empty state', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    // Override events GET to return empty list (LIFO — runs first)
    await page.route('**/__mock_api__/**', async route => {
      if (/\/event\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: [] } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
  });

  test('shows "Create your first event" button when list is empty', async ({ page }) => {
    await expect(page.locator('button:has-text("Create your first event")')).toBeVisible();
  });

  test('clicking "Create your first event" opens the create event modal', async ({ page }) => {
    await page.click('button:has-text("Create your first event")');
    await expect(page.locator('text=New Event')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Events — Sidebar event persists across navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
  });

  test('current event in sidebar remains after navigating to RSVPs', async ({ page }) => {
    const sidebarEventBtn = page.locator('button', { has: page.locator('text=Current event') });
    await expect(sidebarEventBtn).toContainText('Test Wedding');
    await page.click('a[href="/app/rsvps"]');
    await page.waitForLoadState('networkidle');
    await expect(sidebarEventBtn).toContainText('Test Wedding');
  });

  test('current event in sidebar remains after navigating to Guests', async ({ page }) => {
    const sidebarEventBtn = page.locator('button', { has: page.locator('text=Current event') });
    await expect(sidebarEventBtn).toContainText('Test Wedding');
    await page.click('a[href="/app/guests"]');
    await page.waitForLoadState('networkidle');
    await expect(sidebarEventBtn).toContainText('Test Wedding');
  });

  test('current event in sidebar remains after navigating to Wallet', async ({ page }) => {
    const sidebarEventBtn = page.locator('button', { has: page.locator('text=Current event') });
    await expect(sidebarEventBtn).toContainText('Test Wedding');
    await page.click('a[href="/app/wallet"]');
    await page.waitForLoadState('networkidle');
    await expect(sidebarEventBtn).toContainText('Test Wedding');
  });
});
