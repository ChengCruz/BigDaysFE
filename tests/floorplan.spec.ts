/**
 * Floor Plan page tests — /app/tables/floorplan
 * Covers: render, toolbar controls, header actions, zoom, snap, and table modal.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockApi, setMockAuth, MOCK_EVENT_GUID, MOCK_TABLE, MOCK_GUEST, MOCK_GUEST_ASSIGNED } from './helpers';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Navigate to the floor plan page as Admin with default mocks. */
async function gotoFloorPlan(page: Parameters<typeof gotoAuthenticated>[0]) {
  await gotoAuthenticated(page, '/app/tables/floorplan');
}

/** Navigate to floor plan with tables + guests seeded in mock API. */
async function gotoFloorPlanWithData(page: Parameters<typeof gotoAuthenticated>[0]) {
  await mockApi(page);
  // Override tables and guests endpoints (LIFO — runs first)
  await page.route('**/__mock_api__/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (/\/Table\//i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: [MOCK_TABLE] } });
    }
    if (/\/Guest\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_GUEST, MOCK_GUEST_ASSIGNED] },
      });
    }
    return route.fallback();
  });
  await page.goto('/login');
  await setMockAuth(page);
  await page.goto('/app/tables/floorplan');
  await page.waitForLoadState('networkidle');
}

// ── Read (render) ─────────────────────────────────────────────────────────────

test.describe('Floor Plan — Render', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFloorPlan(page);
  });

  test('shows "Floor Plan" heading', async ({ page }) => {
    await expect(page.locator('h2:has-text("Floor Plan")')).toBeVisible();
  });

  test('shows tables count badge', async ({ page }) => {
    await expect(page.locator('text=tables').first()).toBeVisible();
  });

  test('shows seated count badge', async ({ page }) => {
    await expect(page.locator('text=/\\d+\\/\\d+ seated/')).toBeVisible();
  });

  test('canvas element is present', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible();
  });
});

// ── Header action buttons ─────────────────────────────────────────────────────

test.describe('Floor Plan — Header buttons', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFloorPlan(page);
  });

  test('"Auto-Arrange" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Auto-Arrange")')).toBeVisible();
  });

  test('"Save Layout" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Save Layout")')).toBeVisible();
  });

  test('"New Table" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("New Table")')).toBeVisible();
  });

  test('"New Table" button opens the table form modal', async ({ page }) => {
    await page.click('button:has-text("New Table")');
    // Modal should appear — look for a heading or label inside it
    await expect(
      page.locator('[role="dialog"], .modal, form').first()
    ).toBeVisible({ timeout: 3000 });
  });

  test('"Save Layout" button triggers save (no error toast)', async ({ page }) => {
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Failed to save layout')).not.toBeVisible();
  });
});

// ── Toolbar ───────────────────────────────────────────────────────────────────

test.describe('Floor Plan — Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFloorPlan(page);
  });

  test('round table tool button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Round table"]')).toBeVisible();
  });

  test('long table tool button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Long table"]')).toBeVisible();
  });

  test('square table tool button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Square table"]')).toBeVisible();
  });

  test('stage decoration button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Add stage"]')).toBeVisible();
  });

  test('dance floor decoration button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Add dance floor"]')).toBeVisible();
  });

  test('wall decoration button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Add wall"]')).toBeVisible();
  });

  test('pillar decoration button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Add pillar"]')).toBeVisible();
  });
});

// ── Zoom & view controls ──────────────────────────────────────────────────────

test.describe('Floor Plan — Zoom & view controls', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFloorPlan(page);
  });

  test('zoom percentage label shows 100% by default', async ({ page }) => {
    await expect(page.locator('text=100%')).toBeVisible();
  });

  test('zoom-out button decrements zoom', async ({ page }) => {
    await page.click('button:has-text("−")');
    await expect(page.locator('text=90%')).toBeVisible();
  });

  test('zoom-in button increments zoom', async ({ page }) => {
    await page.click('button:has-text("+")');
    await expect(page.locator('text=110%')).toBeVisible();
  });

  test('zoom-out then reset view restores 100%', async ({ page }) => {
    await page.click('button:has-text("−")');
    await expect(page.locator('text=90%')).toBeVisible();
    await page.click('button[title="Reset view"]');
    await expect(page.locator('text=100%')).toBeVisible();
  });

  test('Snap button is visible and toggleable', async ({ page }) => {
    const snapBtn = page.locator('button[title^="Snap to grid"]');
    await expect(snapBtn).toBeVisible();
    // Initially ON — click to toggle OFF
    await snapBtn.click();
    await expect(page.locator('button[title="Snap to grid: OFF"]')).toBeVisible();
    // Click again to restore ON
    await snapBtn.click();
    await expect(page.locator('button[title="Snap to grid: ON"]')).toBeVisible();
  });

  test('reset view button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Reset view"]')).toBeVisible();
  });

  test('print button is visible', async ({ page }) => {
    await expect(page.locator('button[title="Print layout"]')).toBeVisible();
  });
});

// ── With seeded data ──────────────────────────────────────────────────────────

test.describe('Floor Plan — With table & guest data', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFloorPlanWithData(page);
  });

  test('tables count badge reflects seeded table', async ({ page }) => {
    // MOCK_TABLE is the single table returned — badge shows "1 tables"
    await expect(page.locator('text=/1 tables?/')).toBeVisible();
  });

  test('unassigned guest badge is visible when guests are unassigned', async ({ page }) => {
    // MOCK_GUEST has tableId: null → unassigned
    await expect(page.locator('text=/\\d+ unassigned/')).toBeVisible();
  });
});

// ── No event selected ─────────────────────────────────────────────────────────

test.describe('Floor Plan — No event selected', () => {
  test('shows "No Event Selected" message when eventId is missing', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    // Set auth but explicitly clear the eventId
    await page.evaluate(() => {
      localStorage.setItem('has_session', '1');
      localStorage.removeItem('eventId');
    });
    await page.goto('/app/tables/floorplan');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=No Event Selected')).toBeVisible();
  });
});
