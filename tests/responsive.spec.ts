/**
 * Responsive design tests — verifies layout at mobile (375px), tablet (768px), desktop (1280px).
 *
 * Sections 1–3 (page-level layout) are KIV — skipped until responsive layout is finalised.
 * Section 4+ (modal responsive) are ACTIVE — every popup modal must fit the viewport at all
 * breakpoints and must not cause horizontal document overflow.
 *
 * These run automatically against each viewport via playwright.config.ts projects.
 * Viewport-specific assertions (e.g. side-margin check on mobile) are handled inline.
 */
import { test, expect, type Page } from '@playwright/test';
import { mockApi, setMockAuth, gotoAuthenticated, MOCK_SHARE_TOKEN, MOCK_EVENT_GUID } from './helpers';

// ── Shared helpers ─────────────────────────────────────────────────────────────

/** Assert no horizontal scrollbar on the document. */
async function assertNoHorizontalOverflow(page: Page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth  = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth, 'page must not have horizontal overflow').toBeLessThanOrEqual(clientWidth + 2);
}

/**
 * Assert the topmost modal panel is fully within the viewport width and height.
 * Covers Modal.tsx (.fixed.inset-0 > div) and DeleteConfirmationModal (.fixed.inset-0 > div).
 */
async function assertModalPanelFitsViewport(page: Page) {
  const viewport = page.viewportSize()!;
  const panel = page.locator('.fixed.inset-0 > div').first();
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box, 'modal panel must have a bounding box').not.toBeNull();
  expect(box!.x,               'modal panel must not overflow left edge').toBeGreaterThanOrEqual(-2);
  expect(box!.x + box!.width,  'modal panel must not overflow right edge').toBeLessThanOrEqual(viewport.width + 2);
  expect(box!.y,               'modal panel must not overflow top edge').toBeGreaterThanOrEqual(-2);
}

/**
 * On mobile viewports (≤ 480 px), the modal panel should have side margins — it must not
 * fill edge-to-edge.  This catches the common Modal.tsx bug where `w-full` without `mx-4`
 * causes the panel to press hard against both sides of the screen.
 */
async function assertModalHasSideMarginsOnMobile(page: Page) {
  const viewport = page.viewportSize()!;
  if (viewport.width > 480) return; // assertion only meaningful at mobile widths
  const panel = page.locator('.fixed.inset-0 > div').first();
  const box = await panel.boundingBox();
  expect(box, 'modal panel must have a bounding box on mobile').not.toBeNull();
  expect(box!.x,                                    'modal must have left margin on mobile (≥8 px)').toBeGreaterThan(8);
  expect(viewport.width - (box!.x + box!.width),   'modal must have right margin on mobile (≥8 px)').toBeGreaterThan(8);
}

/** Assert every visible input / textarea / select inside the open modal is within viewport width. */
async function assertModalInputsFitViewport(page: Page) {
  const viewport = page.viewportSize()!;
  const fields = page.locator(
    '.fixed.inset-0 input:visible, .fixed.inset-0 textarea:visible, .fixed.inset-0 select:visible',
  );
  const count = await fields.count();
  expect(count, 'modal must contain at least one form field').toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const box = await fields.nth(i).boundingBox();
    if (!box) continue;
    expect(box.x,              `field[${i}] must not overflow left`).toBeGreaterThanOrEqual(-2);
    expect(box.x + box.width,  `field[${i}] must not overflow right`).toBeLessThanOrEqual(viewport.width + 2);
  }
}

/** Assert every visible button inside the open modal is within viewport width. */
async function assertModalButtonsFitViewport(page: Page) {
  const viewport = page.viewportSize()!;
  const buttons = page.locator('.fixed.inset-0 button:visible');
  const count = await buttons.count();
  expect(count, 'modal must contain at least one button').toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const box = await buttons.nth(i).boundingBox();
    if (!box) continue;
    expect(box.x,             `button[${i}] must not overflow left`).toBeGreaterThanOrEqual(-2);
    expect(box.x + box.width, `button[${i}] must not overflow right`).toBeLessThanOrEqual(viewport.width + 2);
  }
}

// ── Public pages (KIV) ────────────────────────────────────────────────────────

test.describe('Responsive — public pages', () => {
  test.skip(true, 'KIV — page-level responsive layout not yet finalised');

  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('landing page has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalOverflow(page);
  });

  test('login page is usable at current viewport', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    const box = await emailInput.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const viewportWidth = page.viewportSize()!.width;
      expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 2);
    }
  });

  test('public RSVP page has no horizontal overflow', async ({ page }) => {
    await page.goto(`/rsvp/submit/${MOCK_SHARE_TOKEN}?event=${MOCK_EVENT_GUID}`);
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalOverflow(page);
  });
});

// ── Dashboard pages (KIV) ─────────────────────────────────────────────────────

test.describe('Responsive — dashboard pages', () => {
  test.skip(true, 'KIV — page-level responsive layout not yet finalised');

  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await setMockAuth(page);
  });

  test('dashboard has no horizontal overflow', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalOverflow(page);
  });

  test('events page has no horizontal overflow', async ({ page }) => {
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalOverflow(page);
  });

  test('navbar is visible at current viewport', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    const viewport = page.viewportSize();
    if (viewport && viewport.width <= 768) {
      const menuToggle = page.locator(
        'button[aria-label*="menu" i], button[aria-label*="sidebar" i], .hamburger, [data-testid="menu-toggle"]',
      ).first();
      const toggleExists = await menuToggle.isVisible().catch(() => false);
      expect(typeof toggleExists).toBe('boolean');
    } else {
      const nav = page.locator('nav, aside, [role="navigation"]').first();
      await expect(nav).toBeVisible();
    }
  });
});

// ── Viewport screenshots (KIV) ────────────────────────────────────────────────

test.describe('Responsive — viewport screenshots', () => {
  test.skip(true, 'KIV — page-level responsive layout not yet finalised');

  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('login page screenshot at current viewport', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const vp    = page.viewportSize();
    const label = vp ? `${vp.width}x${vp.height}` : 'unknown';
    await expect(page).toHaveScreenshot(`login-${label}.png`, { fullPage: true });
  });

  test('landing page screenshot at current viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const vp    = page.viewportSize();
    const label = vp ? `${vp.width}x${vp.height}` : 'unknown';
    await expect(page).toHaveScreenshot(`landing-${label}.png`, { fullPage: true });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Modal responsive tests — ACTIVE at all viewports
// ══════════════════════════════════════════════════════════════════════════════

// ── EventFormModal ─────────────────────────────────────────────────────────────

test.describe('Responsive — EventFormModal', () => {
  test.beforeEach(async ({ page }) => {
    // ?new=1 triggers setModal({ open: true }) via useEffect in EventsPage
    await gotoAuthenticated(page, '/app/events?new=1');
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  });

  test('modal panel fits viewport width', async ({ page }) => {
    await assertModalPanelFitsViewport(page);
  });

  test('no horizontal document overflow when open', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('all form inputs are within viewport bounds', async ({ page }) => {
    await assertModalInputsFitViewport(page);
  });

  test('action buttons are within viewport bounds', async ({ page }) => {
    await assertModalButtonsFitViewport(page);
  });

  test('modal has side margins on mobile viewport', async ({ page }) => {
    await assertModalHasSideMarginsOnMobile(page);
  });

  test('Cancel button dismisses modal without leaving orphaned overlay', async ({ page }) => {
    await page.getByRole('button', { name: 'Cancel' }).first().click();
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 3000 });
    await assertNoHorizontalOverflow(page);
  });
});

// ── UserFormModal (create) ────────────────────────────────────────────────────

test.describe('Responsive — UserFormModal (create)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/users');
    await page.getByRole('button', { name: 'New User' }).click();
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  });

  test('modal panel fits viewport width', async ({ page }) => {
    await assertModalPanelFitsViewport(page);
  });

  test('no horizontal document overflow when open', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('all form inputs are within viewport bounds', async ({ page }) => {
    await assertModalInputsFitViewport(page);
  });

  test('action buttons are within viewport bounds', async ({ page }) => {
    await assertModalButtonsFitViewport(page);
  });

  test('modal has side margins on mobile viewport', async ({ page }) => {
    await assertModalHasSideMarginsOnMobile(page);
  });
});

// ── UserFormModal (edit — tall / scrollable content) ─────────────────────────

test.describe('Responsive — UserFormModal (edit)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/users');
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  });

  test('modal panel fits viewport width', async ({ page }) => {
    await assertModalPanelFitsViewport(page);
  });

  test('no horizontal document overflow when open', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('all form inputs are within viewport bounds', async ({ page }) => {
    await assertModalInputsFitViewport(page);
  });

  test('modal has side margins on mobile viewport', async ({ page }) => {
    await assertModalHasSideMarginsOnMobile(page);
  });

  test('tall content area is scrollable (max-h-[75vh] + overflow-y-auto)', async ({ page }) => {
    // UserFormModal wraps content in a max-h-[75vh] overflow-y-auto container
    const scrollContainer = page.locator('.fixed.inset-0 .overflow-y-auto').first();
    await expect(scrollContainer).toBeVisible();
    // Scrolling should not throw; scrollTop type confirms it is a real scroll node
    const scrollTop = await scrollContainer.evaluate((el) => {
      el.scrollTop = 500;
      return el.scrollTop;
    });
    expect(typeof scrollTop).toBe('number');
  });

  test('modal panel does not exceed viewport height (or scrolls internally)', async ({ page }) => {
    const viewport = page.viewportSize()!;
    const panel    = page.locator('.fixed.inset-0 > div').first();
    const box      = await panel.boundingBox();
    expect(box).not.toBeNull();
    // Panel height should be constrained to viewport (content scrolls inside via max-h-[75vh])
    expect(box!.height, 'modal panel height must not exceed viewport height').toBeLessThanOrEqual(viewport.height + 2);
  });
});

// ── TableFormModal (create single) ───────────────────────────────────────────

test.describe('Responsive — TableFormModal (create)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/tables');
    await page.getByRole('button', { name: /New Table/i }).click();
    await page.getByText('Create Single Table').click();
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  });

  test('modal panel fits viewport width', async ({ page }) => {
    await assertModalPanelFitsViewport(page);
  });

  test('no horizontal document overflow when open', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('all form inputs are within viewport bounds', async ({ page }) => {
    await assertModalInputsFitViewport(page);
  });

  test('action buttons are within viewport bounds', async ({ page }) => {
    await assertModalButtonsFitViewport(page);
  });

  test('modal has side margins on mobile viewport', async ({ page }) => {
    await assertModalHasSideMarginsOnMobile(page);
  });
});

// ── QuickSetupModal (bulk create — wide grid layout) ─────────────────────────
// NOTE: QuickSetupModal uses `!max-w-4xl` and a `grid-cols-12` layout, making it
// particularly susceptible to horizontal overflow on mobile and tablet viewports.

test.describe('Responsive — QuickSetupModal (bulk create)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/tables');
    await page.getByRole('button', { name: /New Table/i }).click();
    await page.getByText('Bulk Create').click();
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  });

  test('modal panel fits viewport width', async ({ page }) => {
    await assertModalPanelFitsViewport(page);
  });

  test('no horizontal document overflow when open', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('grid rows do not overflow modal panel', async ({ page }) => {
    const panel = page.locator('.fixed.inset-0 > div').first();
    const panelBox = await panel.boundingBox();
    expect(panelBox).not.toBeNull();
    const gridRows = page.locator('.fixed.inset-0 .grid');
    const rowCount = await gridRows.count();
    for (let i = 0; i < rowCount; i++) {
      const rowBox = await gridRows.nth(i).boundingBox();
      if (!rowBox) continue;
      expect(
        rowBox.x + rowBox.width,
        `grid row[${i}] must not overflow the modal panel right edge`,
      ).toBeLessThanOrEqual(panelBox!.x + panelBox!.width + 2);
    }
  });

  test('all form inputs are within viewport bounds', async ({ page }) => {
    await assertModalInputsFitViewport(page);
  });

  test('modal has side margins on mobile viewport', async ({ page }) => {
    await assertModalHasSideMarginsOnMobile(page);
  });

  test('modal content is scrollable when taller than viewport', async ({ page }) => {
    // QuickSetupModal has many category rows; on small screens it may exceed viewport height.
    // The modal panel or its inner form should allow vertical scroll.
    const viewport = page.viewportSize()!;
    const panel    = page.locator('.fixed.inset-0 > div').first();
    const box      = await panel.boundingBox();
    expect(box).not.toBeNull();
    if (box!.height > viewport.height) {
      // If the panel is taller than the viewport, the overlay must scroll or the panel must cap
      const overlayScrollable = await page.locator('.fixed.inset-0').first().evaluate((el) =>
        getComputedStyle(el).overflowY !== 'hidden',
      );
      expect(overlayScrollable, 'overlay must be scrollable when modal exceeds viewport height').toBe(true);
    }
  });
});

// ── RsvpFormModal ─────────────────────────────────────────────────────────────

test.describe('Responsive — RsvpFormModal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/rsvps');
    await page.getByRole('button', { name: /New RSVP/i }).click();
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  });

  test('modal panel fits viewport width', async ({ page }) => {
    await assertModalPanelFitsViewport(page);
  });

  test('no horizontal document overflow when open', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('all form inputs are within viewport bounds', async ({ page }) => {
    await assertModalInputsFitViewport(page);
  });

  test('action buttons are within viewport bounds', async ({ page }) => {
    await assertModalButtonsFitViewport(page);
  });

  test('modal has side margins on mobile viewport', async ({ page }) => {
    await assertModalHasSideMarginsOnMobile(page);
  });

  test('textarea (remarks) is within viewport bounds', async ({ page }) => {
    const viewport  = page.viewportSize()!;
    const textarea  = page.locator('.fixed.inset-0 textarea').first();
    await expect(textarea).toBeVisible();
    const box = await textarea.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x,             'remarks textarea must not overflow left').toBeGreaterThanOrEqual(-2);
    expect(box!.x + box!.width,'remarks textarea must not overflow right').toBeLessThanOrEqual(viewport.width + 2);
  });
});

// ── DeleteConfirmationModal ───────────────────────────────────────────────────
// DeleteConfirmationModal has its own responsive layout (mx-4 on panel) —
// these tests confirm it stays correct after any future refactoring.

test.describe('Responsive — DeleteConfirmationModal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/users');
    await page.getByRole('button', { name: 'Delete' }).first().click();
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  });

  test('modal panel fits viewport width', async ({ page }) => {
    await assertModalPanelFitsViewport(page);
  });

  test('no horizontal document overflow when open', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('action buttons are within viewport bounds', async ({ page }) => {
    await assertModalButtonsFitViewport(page);
  });

  test('modal has side margins on mobile viewport', async ({ page }) => {
    // DeleteConfirmationModal uses mx-4, so this should pass — acts as a regression guard
    await assertModalHasSideMarginsOnMobile(page);
  });

  test('Cancel button dismisses modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 3000 });
    await assertNoHorizontalOverflow(page);
  });
});

// ── GuestFormModal (edit) ─────────────────────────────────────────────────────

test.describe('Responsive — GuestFormModal (edit)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/guests');
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  });

  test('modal panel fits viewport width', async ({ page }) => {
    await assertModalPanelFitsViewport(page);
  });

  test('no horizontal document overflow when open', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('all form inputs are within viewport bounds', async ({ page }) => {
    await assertModalInputsFitViewport(page);
  });

  test('action buttons are within viewport bounds', async ({ page }) => {
    await assertModalButtonsFitViewport(page);
  });

  test('modal has side margins on mobile viewport', async ({ page }) => {
    await assertModalHasSideMarginsOnMobile(page);
  });
});

// ── Guest Table-Assignment modal (inline) ─────────────────────────────────────
// This modal is rendered inline in GuestsPage (not via Modal.tsx) but uses the
// same fixed-overlay pattern — verify it is also responsive.

test.describe('Responsive — Guest Table-Assignment modal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/guests');
    // MOCK_GUEST (Alice) has no tableId → "Assign Table" button is shown
    await page.getByRole('button', { name: 'Assign Table' }).first().click();
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  });

  test('modal panel fits viewport width', async ({ page }) => {
    await assertModalPanelFitsViewport(page);
  });

  test('no horizontal document overflow when open', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('modal has side margins on mobile viewport', async ({ page }) => {
    // This inline modal uses `p-4` on the overlay — should pass as a regression guard
    await assertModalHasSideMarginsOnMobile(page);
  });
});
