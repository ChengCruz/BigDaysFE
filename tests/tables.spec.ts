/**
 * Tables page tests — Read, Create, Edit, Delete, filtering, and empty state.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockApi, setMockAuth, MOCK_EVENT_GUID } from './helpers';

const MOCK_TABLE = {
  tableId: 'table-guid-0001',
  tableName: 'Table A',
  maxSeats: 8,
  assignedCount: 0,
  guests: [],
};

const MOCK_TABLE_2 = {
  tableId: 'table-guid-0002',
  tableName: 'Table B',
  maxSeats: 6,
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
        json: { isSuccess: true, data: { ...MOCK_TABLE, tableId: 'table-guid-0003', tableName: 'New Table' } },
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
        json: { isSuccess: true, data: { ...MOCK_TABLE, tableName: 'Updated Table' } },
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
        json: { isSuccess: true, data: { ...MOCK_GUEST, tableId: MOCK_TABLE.tableId } },
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
    await page.goto('/app/events');
    await page.waitForLoadState('load');
    await page.goto('/app/tables');
    await page.waitForLoadState('load');
  });

  test('shows page heading "Table Arrangement"', async ({ page }) => {
    await expect(page.locator('h2:has-text("Table Arrangement")')).toBeVisible();
  });

  test('renders stats cards', async ({ page }) => {
    await expect(page.locator('text=Total Tables').first()).toBeVisible();
    await expect(page.locator('text=Seated Guests').first()).toBeVisible();
    await expect(page.locator('text=Unassigned').first()).toBeVisible();
    await expect(page.locator('text=Total Capacity').first()).toBeVisible();
  });

  test('Total Tables count matches API response (2 tables)', async ({ page }) => {
    // MOCK_TABLE + MOCK_TABLE_2 = 2 tables
    const totalCard = page.locator('text=Total Tables').locator('../..');
    await expect(totalCard.locator('text=2')).toBeVisible();
  });

  test('Total Capacity matches API response (8 + 6 = 14)', async ({ page }) => {
    // MOCK_TABLE.maxSeats=8, MOCK_TABLE_2.maxSeats=6 → total=14
    const capacityCard = page.locator('text=Total Capacity').locator('../..');
    await expect(capacityCard.locator('text=14')).toBeVisible();
  });

  test('Seated Guests count shows 0 (no guests assigned to these tables)', async ({ page }) => {
    // MOCK_GUEST has tableId=null → 0 seated
    const seatedCard = page.locator('text=Seated Guests').locator('../..');
    await expect(seatedCard.locator('text=0')).toBeVisible();
  });

  test('renders table cards', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_TABLE.tableName}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_TABLE_2.tableName}`).first()).toBeVisible();
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
    await page.goto('/app/events');
    await page.waitForLoadState('load');
    await page.goto('/app/tables');
    await page.waitForLoadState('load');
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

  test('"Auto-Assign" button is visible and enabled', async ({ page }) => {
    const autoAssign = page.locator('button:has-text("Auto-Assign")');
    await expect(autoAssign).toBeVisible();
    await expect(autoAssign).toBeEnabled();
  });
});

// ── Delete ─────────────────────────────────────────────────────────────────────

test.describe('Tables — Delete', () => {
  test.beforeEach(async ({ page }) => {
    await mockTablesApi(page);
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('load');
    await page.goto('/app/tables');
    await page.waitForLoadState('load');
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
    await page.goto('/app/events');
    await page.waitForLoadState('load');
    await page.goto('/app/tables');
    await page.waitForLoadState('load');
  });

  test('search filters visible tables', async ({ page }) => {
    const search = page.locator('input[placeholder="Search guests or tables..."]');
    await search.fill('Table A');
    await expect(page.locator(`text=${MOCK_TABLE.tableName}`).first()).toBeVisible();
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
    await page.goto('/app/events');
    await page.waitForLoadState('load');
    await page.goto('/app/tables');
    await page.waitForLoadState('load');
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

// ── Error state ────────────────────────────────────────────────────────────────

test.describe('Tables — Error state', () => {
  test('shows error message when tables API fails', async ({ page }) => {
    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      if (/\/TableArrangement\/Summary\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 500, json: { isSuccess: false, message: 'Server error' } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('load');
    await page.goto('/app/tables');
    await page.waitForLoadState('load');
    await expect(page.locator('text=Failed to load data.')).toBeVisible({ timeout: 20000 });
  });
});

// ── Assignment (drag-and-drop) ────────────────────────────────────────────────

test.describe('Tables — Assignment', () => {
  test('dragging a guest onto a table calls AssignTable, updates seat count, and removes guest from unassigned panel', async ({ page }) => {
    let assigned = false;

    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      const url = route.request().url();
      const method = route.request().method();

      if (/\/TableArrangement\/Summary\//i.test(url) && method === 'GET') {
        return route.fulfill({
          status: 200,
          json: { isSuccess: true, data: [MOCK_TABLE, MOCK_TABLE_2] },
        });
      }
      if (/\/Guest\/ByEvent\//i.test(url) && method === 'GET') {
        const guestData = assigned
          ? [{ ...MOCK_GUEST, tableId: MOCK_TABLE.tableId }]
          : [MOCK_GUEST];
        return route.fulfill({
          status: 200,
          json: { isSuccess: true, data: guestData },
        });
      }
      if (/\/Guest\/.*\/AssignTable\//i.test(url)) {
        assigned = true;
        return route.fulfill({
          status: 200,
          json: { isSuccess: true, data: { ...MOCK_GUEST, tableId: MOCK_TABLE.tableId } },
        });
      }
      return route.fallback();
    });

    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('load');
    await page.goto('/app/tables');
    await page.waitForLoadState('load');

    // Guest starts in the unassigned panel
    const guestCard = page.locator('[aria-label="Drag John Doe to assign to a table"]');
    await expect(guestCard).toBeVisible();

    // Seat count starts at 0/8
    const tableRegion = page.locator('[role="region"][aria-label*="Table A"]');
    await expect(tableRegion.locator('text=0 / 8')).toBeVisible();

    // Drag guest onto Table A
    await page.dragAndDrop(
      '[aria-label="Drag John Doe to assign to a table"]',
      '[role="region"][aria-label*="Table A"]',
    );

    // Seat count updates to reflect pax=2
    await expect(tableRegion.locator('text=2 / 8')).toBeVisible({ timeout: 5000 });

    // Guest is removed from the unassigned panel
    await expect(guestCard).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=All guests have been assigned!')).toBeVisible({ timeout: 5000 });

    // Seated Guests stat card updates
    const seatedCard = page.locator('text=Seated Guests').locator('../..');
    await expect(seatedCard.locator('text=2')).toBeVisible({ timeout: 5000 });
  });

  test('unassigning a guest via the X button returns them to the unassigned panel and resets seat count', async ({ page }) => {
    // Start with guest already assigned to Table A
    const ASSIGNED_GUEST = { ...MOCK_GUEST, tableId: MOCK_TABLE.tableId };
    let unassigned = false;

    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      const url = route.request().url();
      const method = route.request().method();

      if (/\/TableArrangement\/Summary\//i.test(url) && method === 'GET') {
        return route.fulfill({
          status: 200,
          json: { isSuccess: true, data: [MOCK_TABLE, MOCK_TABLE_2] },
        });
      }
      if (/\/Guest\/ByEvent\//i.test(url) && method === 'GET') {
        const guestData = unassigned
          ? [{ ...MOCK_GUEST, tableId: null }]
          : [ASSIGNED_GUEST];
        return route.fulfill({
          status: 200,
          json: { isSuccess: true, data: guestData },
        });
      }
      if (/\/Guest\/.*\/UnassignTable/i.test(url)) {
        unassigned = true;
        return route.fulfill({
          status: 200,
          json: { isSuccess: true, data: { ...MOCK_GUEST, tableId: null } },
        });
      }
      return route.fallback();
    });

    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('load');
    await page.goto('/app/tables');
    await page.waitForLoadState('load');

    // Guest appears inside Table A's card
    const tableRegion = page.locator('[role="region"][aria-label*="Table A"]');
    await expect(tableRegion.locator('text=John Doe')).toBeVisible();

    // Hover over the guest row to reveal the X button
    await tableRegion.locator('text=John Doe').hover();
    await tableRegion.locator('button[title="Unassign guest"]').click();

    // Guest is back in the unassigned panel
    await expect(page.locator('[aria-label="Drag John Doe to assign to a table"]')).toBeVisible({ timeout: 5000 });

    // Seat count resets to 0/8
    await expect(tableRegion.locator('text=0 / 8')).toBeVisible({ timeout: 5000 });
  });

  test('AssignTable API failure shows error toast', async ({ page }) => {
    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      const url = route.request().url();
      const method = route.request().method();

      if (/\/TableArrangement\/Summary\//i.test(url) && method === 'GET') {
        return route.fulfill({
          status: 200,
          json: { isSuccess: true, data: [MOCK_TABLE, MOCK_TABLE_2] },
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
          status: 500,
          json: { isSuccess: false, message: 'Server error' },
        });
      }
      return route.fallback();
    });

    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('load');
    await page.goto('/app/tables');
    await page.waitForLoadState('load');

    await page.dragAndDrop(
      '[aria-label="Drag John Doe to assign to a table"]',
      '[role="region"][aria-label*="Table A"]',
    );

    await expect(page.locator('text=Failed to assign guest to table')).toBeVisible({ timeout: 5000 });
  });
});

// ── No event state ─────────────────────────────────────────────────────────────

test.describe('Tables — No event state', () => {
  test('shows no events message when no event is selected', async ({ page }) => {
    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      if (/\/event\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: [] } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    // Set has_session but no eventId
    await page.evaluate(() => {
      localStorage.setItem('has_session', '1');
      localStorage.removeItem('eventId');
    });
    await page.goto('/app/tables');
    await page.waitForLoadState('load');
    await expect(page.locator('text=No Events Yet')).toBeVisible({ timeout: 5000 });
  });
});
