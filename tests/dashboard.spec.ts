/**
 * Dashboard page tests — quick actions navigation and page rendering.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, MOCK_EVENT_GUID } from './helpers';

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
