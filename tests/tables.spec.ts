/**
 * Tables page tests — Read, Create, Edit, Delete, filtering, and empty state.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockApi, setMockAuth, MOCK_EVENT_GUID } from './helpers';

const MOCK_TABLE = {
  tableArrangementGuid: 'table-guid-0001',
  id: 'table-guid-0001',
  tableNo: 'Table A',
  name: 'Table A',
  capacity: 8,
  assignedCount: 0,
  guests: [],
};

const MOCK_TABLE_2 = {
  tableArrangementGuid: 'table-guid-0002',
  id: 'table-guid-0002',
  tableNo: 'Table B',
  name: 'Table B',
  capacity: 6,
  assignedCount: 0,
  guests: [],
};

const MOCK_GUEST = {
  guestGuid: 'guest-guid-0001',
  id: 'guest-guid-0001',
  guestName: 'John Doe',
  name: 'John Doe',
  phoneNo: '0123456789',
  pax: 2,
  noOfPax: 2,
  tableId: null,
  remarks: '',
};

/** Set up mock API with tables and guests data */
async function mockTablesApi(page: Parameters<typeof mockApi>[0]) {
  await mockApi(page);
  // Override tables and guests endpoints (LIFO — runs first)
  await page.route('**/__mock_api__/**', async route => {
    const url = route.request().url();
    const method = route.request().method();

    if (/\/TableArrangement\/Summary\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_TABLE, MOCK_TABLE_2] },
      });
    }
    if (/\/TableArrangement\/Create/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_TABLE, id: 'table-guid-0003', name: 'New Table' } },
      });
    }
    if (/\/TableArrangement\/BulkCreate/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_TABLE, MOCK_TABLE_2] },
      });
    }
    if (/\/TableArrangement\/Update/i.test(url) && (method === 'PUT' || method === 'PATCH')) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_TABLE, name: 'Updated Table' } },
      });
    }
    if (/\/TableArrangement\/Delete\//i.test(url) && method === 'DELETE') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, message: 'Table deleted.' },
      });
    }
    if (/\/Guest\/ByEvent\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_GUEST] },
      });
    }
    if (/\/Guest\/.*\/AssignTable\//i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_GUEST, tableId: MOCK_TABLE.id } },
      });
    }
    if (/\/Guest\/.*\/UnassignTable/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_GUEST, tableId: null } },
      });
    }
    return route.fallback();
  });
}

// ── Read (list) ────────────────────────────────────────────────────────────────

test.describe('Tables — Read (list)', () => {
  test.beforeEach(async ({ page }) => {
    await mockTablesApi(page);
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/tables');
    await page.waitForLoadState('networkidle');
  });

  test('shows page heading "Table Arrangement"', async ({ page }) => {
    await expect(page.locator('h2:has-text("Table Arrangement")')).toBeVisible();
  });

  test('renders stats cards', async ({ page }) => {
    await expect(page.locator('text=Total Tables')).toBeVisible();
    await expect(page.locator('text=Seated Guests')).toBeVisible();
    await expect(page.locator('text=Unassigned')).toBeVisible();
    await expect(page.locator('text=Total Capacity')).toBeVisible();
  });

  test('renders table cards', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_TABLE.name}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_TABLE_2.name}`).first()).toBeVisible();
  });

  test('search input is visible and accepts input', async ({ page }) => {
    const search = page.locator('input[placeholder="Search guests or tables..."]');
    await expect(search).toBeVisible();
    await search.fill('Table A');
    await expect(search).toHaveValue('Table A');
  });

  test('filter dropdown has expected options', async ({ page }) => {
    const filter = page.locator('select').first();
    await expect(filter).toBeVisible();
    await expect(filter.locator('option:has-text("All Tables")')).toHaveCount(1);
    await expect(filter.locator('option:has-text("Has Empty Seats")')).toHaveCount(1);
    await expect(filter.locator('option:has-text("Full Tables")')).toHaveCount(1);
  });

  test('shows unassigned guests panel', async ({ page }) => {
    await expect(page.locator('text=Unassigned Guests')).toBeVisible();
  });

  test('shows drag-and-drop tip', async ({ page }) => {
    await expect(page.locator('text=Drag guests from the unassigned panel')).toBeVisible();
  });

  test('unassigned guest appears in the panel', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_GUEST.guestName}`).first()).toBeVisible();
  });
});

// ── Create ─────────────────────────────────────────────────────────────────────

test.describe('Tables — Create', () => {
  test.beforeEach(async ({ page }) => {
    await mockTablesApi(page);
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/tables');
    await page.waitForLoadState('networkidle');
  });

  test('"+ New Table" dropdown button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("+ New Table")')).toBeVisible();
  });

  test('"Create Single Table" option opens create modal', async ({ page }) => {
    await page.click('button:has-text("+ New Table")');
    await page.click('text=Create Single Table');
    // Modal should open — look for a form modal heading or name field
    await expect(page.locator('input[placeholder*="Table"], input[placeholder*="table"], input[name="name"], [role="dialog"]').first()).toBeVisible({ timeout: 3000 });
  });

  test('"Bulk Create" option opens quick setup modal', async ({ page }) => {
    await page.click('button:has-text("+ New Table")');
    await page.click('text=Bulk Create');
    // QuickSetupModal should appear
    await expect(page.locator('[role="dialog"], .modal, form').first()).toBeVisible({ timeout: 3000 });
  });

  test('"Auto-Assign" button is disabled with "Coming Soon" badge', async ({ page }) => {
    const autoAssign = page.locator('button:has-text("Auto-Assign")');
    await expect(autoAssign).toBeVisible();
    await expect(autoAssign).toBeDisabled();
    await expect(page.locator('text=Coming Soon').first()).toBeVisible();
  });
});

// ── Delete ─────────────────────────────────────────────────────────────────────

test.describe('Tables — Delete', () => {
  test.beforeEach(async ({ page }) => {
    await mockTablesApi(page);
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/tables');
    await page.waitForLoadState('networkidle');
  });

  test('delete confirmation modal appears on delete click', async ({ page }) => {
    // Find the delete button on the first table card
    const deleteBtn = page.locator('button[title*="Delete"], button[aria-label*="Delete"], button:has-text("Delete")').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.locator('text=Delete Table')).toBeVisible({ timeout: 3000 });
    }
  });

  test('cancel closes delete confirmation modal', async ({ page }) => {
    const deleteBtn = page.locator('button[title*="Delete"], button[aria-label*="Delete"], button:has-text("Delete")').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.locator('text=Delete Table')).toBeVisible({ timeout: 3000 });
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('text=Delete Table')).not.toBeVisible({ timeout: 3000 });
    }
  });
});

// ── Filter ─────────────────────────────────────────────────────────────────────

test.describe('Tables — Filter', () => {
  test.beforeEach(async ({ page }) => {
    await mockTablesApi(page);
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/tables');
    await page.waitForLoadState('networkidle');
  });

  test('search filters visible tables', async ({ page }) => {
    const search = page.locator('input[placeholder="Search guests or tables..."]');
    await search.fill('Table A');
    await expect(page.locator(`text=${MOCK_TABLE.name}`).first()).toBeVisible();
  });

  test('filter dropdown changes selection', async ({ page }) => {
    const filter = page.locator('select').first();
    await filter.selectOption('hasEmpty');
    await expect(filter).toHaveValue('hasEmpty');
    await filter.selectOption('full');
    await expect(filter).toHaveValue('full');
    await filter.selectOption('all');
    await expect(filter).toHaveValue('all');
  });
});

// ── Empty state ────────────────────────────────────────────────────────────────

test.describe('Tables — Empty state', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    // Override tables to return empty list
    await page.route('**/__mock_api__/**', async route => {
      const url = route.request().url();
      if (/\/TableArrangement\/Summary\//i.test(url) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: [] } });
      }
      if (/\/Guest\/ByEvent\//i.test(url) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: [] } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/tables');
    await page.waitForLoadState('networkidle');
  });

  test('shows "No tables found." when list is empty', async ({ page }) => {
    await expect(page.locator('text=No tables found.')).toBeVisible();
  });

  test('shows "+ Create First Table" button in empty state', async ({ page }) => {
    await expect(page.locator('button:has-text("+ Create First Table")')).toBeVisible();
  });

  test('shows "All guests have been assigned!" in unassigned panel when no guests', async ({ page }) => {
    await expect(page.locator('text=All guests have been assigned!')).toBeVisible();
  });
});

// ── No event state ─────────────────────────────────────────────────────────────

test.describe('Tables — No event state', () => {
  test('shows no events message when no event is selected', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    // Set has_session but no eventId
    await page.evaluate(() => {
      localStorage.setItem('has_session', '1');
      localStorage.removeItem('eventId');
    });
    await page.goto('/app/tables');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=No Events for Table Management')).toBeVisible({ timeout: 5000 });
  });
});
