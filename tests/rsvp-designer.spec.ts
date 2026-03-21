/**
 * RSVP Designer page tests — /app/rsvps/designer
 * Covers: page load, toolbar actions, block management, share link, preview modal.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockApi, setMockAuth } from './helpers';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function gotoDesigner(page: Parameters<typeof gotoAuthenticated>[0]) {
  await gotoAuthenticated(page, '/app/rsvps/designer');
}

// ── Page load ─────────────────────────────────────────────────────────────────

test.describe('RSVP Designer — Page load', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesigner(page);
  });

  test('shows "RSVP designer" label in toolbar', async ({ page }) => {
    await expect(page.locator('text=RSVP designer')).toBeVisible();
  });

  test('shows event name in toolbar', async ({ page }) => {
    await expect(page.locator('h1:has-text("Test Wedding")')).toBeVisible();
  });

  test('"← Back" link is visible', async ({ page }) => {
    await expect(page.locator('a:has-text("← Back")')).toBeVisible();
  });

  test('"Save design" button is visible and enabled', async ({ page }) => {
    await expect(page.locator('button:has-text("Save design")')).toBeVisible();
    await expect(page.locator('button:has-text("Save design")')).toBeEnabled();
  });

  test('"Preview" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Preview")')).toBeVisible();
  });

  test('"Share with guests" section is visible', async ({ page }) => {
    await expect(page.locator('text=Share with guests')).toBeVisible();
  });

  test('"Generate link" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Generate link")')).toBeVisible();
  });
});

// ── Default blocks ─────────────────────────────────────────────────────────────

test.describe('RSVP Designer — Default blocks', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesigner(page);
  });

  test('renders default headline block', async ({ page }) => {
    await expect(page.locator('text=headline').first()).toBeVisible();
  });

  test('renders default attendance block', async ({ page }) => {
    await expect(page.locator('text=attendance').first()).toBeVisible();
  });

  test('renders default guestDetails block', async ({ page }) => {
    await expect(page.locator('text=guestDetails').first()).toBeVisible();
  });
});

// ── Add block menu ─────────────────────────────────────────────────────────────

test.describe('RSVP Designer — Add block menu', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesigner(page);
  });

  test('"Add a block" section is visible', async ({ page }) => {
    await expect(page.locator('text=Add a block')).toBeVisible();
  });

  test('all block type buttons are present', async ({ page }) => {
    const labels = ['Headline', 'Paragraph', 'Info badge', 'Attendance', 'Guest info', 'Form field', 'CTA button'];
    for (const label of labels) {
      await expect(page.locator(`button:has-text("${label}")`).first()).toBeVisible();
    }
  });

  test('"Upload image" option is present', async ({ page }) => {
    await expect(page.locator('text=Upload image')).toBeVisible();
  });

  test('"Insert RSVP question" section is present', async ({ page }) => {
    await expect(page.locator('text=Insert RSVP question')).toBeVisible();
  });

  test('clicking "Headline" block type adds a block to the list', async ({ page }) => {
    const initialCount = await page.locator('text=headline').count();
    await page.locator('button:has-text("Headline")').first().click();
    await expect(page.locator('text=headline')).toHaveCount(initialCount + 1);
  });

  test('clicking "Paragraph" block type adds a text block', async ({ page }) => {
    const initialCount = await page.locator('text=text').count();
    await page.locator('button:has-text("Paragraph")').first().click();
    await expect(page.locator('text=text')).toHaveCount(initialCount + 1);
  });

  test('clicking "Attendance" block type adds an attendance block', async ({ page }) => {
    const initialCount = await page.locator('text=attendance').count();
    await page.locator('button:has-text("Attendance")').first().click();
    await expect(page.locator('text=attendance')).toHaveCount(initialCount + 1);
  });
});

// ── Toolbar actions ────────────────────────────────────────────────────────────

test.describe('RSVP Designer — Toolbar actions', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesigner(page);
  });

  test('"← Back" navigates to /app/rsvps', async ({ page }) => {
    await page.click('a:has-text("← Back")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/app\/rsvps/);
  });

  test('"Generate link" generates a public link input', async ({ page }) => {
    await page.click('button:has-text("Generate link")');
    // A readonly input with the link should appear
    await expect(page.locator('input[readonly]')).toBeVisible({ timeout: 3000 });
  });

  test('"Generate link" button changes to "Regenerate link" after click', async ({ page }) => {
    await page.click('button:has-text("Generate link")');
    await expect(page.locator('button:has-text("Regenerate link")')).toBeVisible({ timeout: 3000 });
  });

  test('"Copy link" button appears after generating a link', async ({ page }) => {
    await page.click('button:has-text("Generate link")');
    await expect(page.locator('button:has-text("Copy link")')).toBeVisible({ timeout: 3000 });
  });

  test('"Open as guest" link appears after generating a link', async ({ page }) => {
    await page.click('button:has-text("Generate link")');
    await expect(page.locator('a:has-text("Open as guest")')).toBeVisible({ timeout: 3000 });
  });
});

// ── Preview modal ──────────────────────────────────────────────────────────────

test.describe('RSVP Designer — Preview modal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesigner(page);
  });

  test('clicking "Preview" opens a modal with "RSVP preview" text', async ({ page }) => {
    await page.click('button:has-text("Preview")');
    await expect(page.locator('text=RSVP preview')).toBeVisible({ timeout: 3000 });
  });

  test('preview modal shows event title', async ({ page }) => {
    await page.click('button:has-text("Preview")');
    await expect(page.locator('text=Test Wedding')).toBeVisible({ timeout: 3000 });
  });

  test('preview modal has "Mobile" mode button', async ({ page }) => {
    await page.click('button:has-text("Preview")');
    await expect(page.locator('button:has-text("mobile")')).toBeVisible({ timeout: 3000 });
  });

  test('preview modal has "Desktop" mode button', async ({ page }) => {
    await page.click('button:has-text("Preview")');
    await expect(page.locator('button:has-text("desktop")')).toBeVisible({ timeout: 3000 });
  });

  test('"Close" button dismisses the preview modal', async ({ page }) => {
    await page.click('button:has-text("Preview")');
    await expect(page.locator('text=RSVP preview')).toBeVisible({ timeout: 3000 });
    await page.click('button:has-text("Close")');
    await expect(page.locator('text=RSVP preview')).not.toBeVisible({ timeout: 3000 });
  });
});

// ── No-event state ─────────────────────────────────────────────────────────────

test.describe('RSVP Designer — No event state', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    // Override events to return empty list
    await page.route('**/__mock_api__/**', async (route) => {
      if (/\/event\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: [] } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page, '');
    await page.evaluate(() => localStorage.removeItem('eventId'));
    await page.goto('/app/rsvps/designer');
    await page.waitForLoadState('networkidle');
  });

  test('shows "No Event for RSVP Design" message when no event selected', async ({ page }) => {
    await expect(page.locator('text=No Event for RSVP Design')).toBeVisible({ timeout: 5000 });
  });
});
