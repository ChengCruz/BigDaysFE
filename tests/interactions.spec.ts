/**
 * General navigation & interaction tests.
 * Auth, Events, Wallet, Users CRUD tests are in their own spec files.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated } from './helpers';

test.describe('Dashboard navigation — sidebar links', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/dashboard');
  });

  test('navigates to Events page', async ({ page }) => {
    await page.click('a[title="Events"]');
    await expect(page).toHaveURL(/\/app\/events/);
  });

  test('navigates to Guests page', async ({ page }) => {
    await page.click('a[title="Guests"]');
    await expect(page).toHaveURL(/\/app\/guests/);
  });

  test('navigates to RSVPs page', async ({ page }) => {
    await page.click('a[title="RSVPs"]');
    await expect(page).toHaveURL(/\/app\/rsvps/);
  });

  test('navigates to Wallet page', async ({ page }) => {
    await page.click('a[title="Wallet"]');
    await expect(page).toHaveURL(/\/app\/wallet/);
  });

  test('navigates to Tables page', async ({ page }) => {
    await page.click('a[title="Tables"]');
    await expect(page).toHaveURL(/\/app\/tables/);
  });

  test('navigates to Check-in page', async ({ page }) => {
    await page.click('a[title="Check-in"]');
    await expect(page).toHaveURL(/\/app\/checkin/);
  });

  test('navigates to Users page', async ({ page }) => {
    await page.click('a[title="Users"]');
    await expect(page).toHaveURL(/\/app\/users/);
  });
});
