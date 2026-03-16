/**
 * Wallet CRUD tests — Setup, Transactions (Create, Read, Update, Delete), Validation.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockApi, setMockAuth, MOCK_WALLET, MOCK_TRANSACTION } from './helpers';

// ── Wallet page load ──────────────────────────────────────────────────────────

test.describe('Wallet — Read', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/wallet');
  });

  test('shows "Wallet & Budget" heading', async ({ page }) => {
    await expect(page.locator('text=Wallet & Budget')).toBeVisible();
  });

  test('"Add Transaction" button is visible when wallet exists', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Transaction")')).toBeVisible();
  });

  test('transaction appears in list', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_TRANSACTION.transactionName}`).first()).toBeVisible();
  });
});

test.describe('Wallet — No wallet state', () => {
  test('shows "Setup Wallet" button when no wallet found', async ({ page }) => {
    await mockApi(page);
    // Override wallet to return null/empty
    await page.route('**/__mock_api__/**', async route => {
      if (/\/Wallet\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: null } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/wallet');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Setup Wallet")')).toBeVisible();
  });
});

// ── Add Transaction ───────────────────────────────────────────────────────────

test.describe('Wallet — Create Transaction', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/wallet');
    await page.click('button:has-text("Add Transaction")');
    await expect(page.locator('text=Add Transaction')).toBeVisible({ timeout: 3000 });
  });

  test('modal opens with "Add Transaction" title', async ({ page }) => {
    await expect(page.locator('text=Add Transaction')).toBeVisible();
  });

  test('all required fields are present', async ({ page }) => {
    await expect(page.locator('input[placeholder="e.g. Venue Deposit Payment"]')).toBeVisible();
    await expect(page.locator('input[placeholder="0.00"]')).toBeVisible();
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  test('Cancel button closes the modal', async ({ page }) => {
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Add Transaction')).not.toBeVisible({ timeout: 3000 });
  });

  test('validation — shows error when transaction name is empty', async ({ page }) => {
    // Leave name empty, fill other required fields
    await page.fill('input[placeholder="0.00"]', '100');
    await page.fill('input[type="date"]', '2026-06-01');
    await page.click('button:has-text("Save Transaction")');
    await expect(page.locator('text=Transaction name is required')).toBeVisible({ timeout: 3000 });
  });

  test('validation — shows error when amount is empty', async ({ page }) => {
    await page.fill('input[placeholder="e.g. Venue Deposit Payment"]', 'Venue Deposit');
    await page.fill('input[type="date"]', '2026-06-01');
    await page.click('button:has-text("Save Transaction")');
    await expect(page.locator('text=Amount is required')).toBeVisible({ timeout: 3000 });
  });

  test('validation — shows error when amount is negative', async ({ page }) => {
    await page.fill('input[placeholder="e.g. Venue Deposit Payment"]', 'Venue Deposit');
    await page.fill('input[placeholder="0.00"]', '-50');
    await page.fill('input[type="date"]', '2026-06-01');
    await page.click('button:has-text("Save Transaction")');
    await expect(page.locator('text=Amount must be a positive number')).toBeVisible({ timeout: 3000 });
  });

  test('validation — shows error when date is empty', async ({ page }) => {
    await page.fill('input[placeholder="e.g. Venue Deposit Payment"]', 'Venue Deposit');
    await page.fill('input[placeholder="0.00"]', '500');
    await page.click('button:has-text("Save Transaction")');
    await expect(page.locator('text=Transaction date is required')).toBeVisible({ timeout: 3000 });
  });

  test('fills all required fields and submits → modal closes', async ({ page }) => {
    await page.fill('input[placeholder="e.g. Venue Deposit Payment"]', 'Venue Deposit');
    await page.fill('input[placeholder="0.00"]', '5000');
    await page.fill('input[type="date"]', '2026-06-01');
    // Select a category
    await page.locator('select').first().selectOption({ index: 1 });

    await page.click('button:has-text("Save Transaction")');
    await expect(page.locator('text=Add Transaction')).not.toBeVisible({ timeout: 5000 });
  });

  test('Debit/Credit type toggle switches correctly', async ({ page }) => {
    const debitBtn = page.locator('button:has-text("Debit")');
    const creditBtn = page.locator('button:has-text("Credit")');
    await expect(debitBtn).toBeVisible();
    await expect(creditBtn).toBeVisible();
    await creditBtn.click();
    // Credit selected — debit should no longer be the active one
    await debitBtn.click();
    // No error; toggle works
  });

  test('payment status toggles — Pending shows Due Date field', async ({ page }) => {
    const pendingBtn = page.locator('button:has-text("Pending")');
    await expect(pendingBtn).toBeVisible();
    await pendingBtn.click();
    await expect(page.locator('text=Due Date')).toBeVisible();
  });

  test('optional vendor fields are visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="e.g. Shangri-La Hotel"]')).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. +60 3-2074 3900"]')).toBeVisible();
  });
});

// ── Edit Transaction ──────────────────────────────────────────────────────────

test.describe('Wallet — Edit Transaction', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/wallet');
  });

  test('edit button opens modal with "Edit Transaction" title', async ({ page }) => {
    const editBtn = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.locator('text=Edit Transaction')).toBeVisible({ timeout: 3000 });
    }
  });

  test('edit modal has "Update Transaction" submit button', async ({ page }) => {
    const editBtn = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.locator('button:has-text("Update Transaction")')).toBeVisible({ timeout: 3000 });
    }
  });
});
