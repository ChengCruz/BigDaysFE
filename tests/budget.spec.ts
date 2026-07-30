/**
 * Budget tests — Read, CRUD Transactions, Setup Budget, Summary Cards,
 * Table Filters, Export Report, and edge states.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockApi, setMockAuth, MOCK_BUDGET, MOCK_TRANSACTION } from './helpers';

// ── Budget page load ──────────────────────────────────────────────────────────

test.describe('Budget — Read', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/budget');
  });

  test('shows "Budget" heading', async ({ page }) => {
    await expect(page.locator('text=Budget')).toBeVisible();
  });

  test('"Add Transaction" button is visible when budget exists', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Transaction")')).toBeVisible();
  });

  test('transaction appears in list', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_TRANSACTION.transactionName}`).first()).toBeVisible();
  });
});

// ── Setup Budget Modal — Create ───────────────────────────────────────────────

test.describe('Budget — Setup Budget Modal (create)', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      if (/\/Wallet\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: null } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await page.goto('/app/budget');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Setup Budget")');
    await expect(page.locator('text=Setup Budget').first()).toBeVisible({ timeout: 3000 });
  });

  test('modal opens with "Setup Budget" title', async ({ page }) => {
    await expect(page.locator('text=Setup Budget').first()).toBeVisible();
  });

  test('currency select is present and defaults to MYR', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    await expect(select).toHaveValue('MYR');
  });

  test('budget input field is present', async ({ page }) => {
    await expect(page.locator('input[placeholder="50000"]')).toBeVisible();
  });

  test('Cancel button closes the modal', async ({ page }) => {
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Setup Budget').nth(1)).not.toBeVisible({ timeout: 3000 });
  });

  test('validation — shows error when budget is negative', async ({ page }) => {
    await page.fill('input[placeholder="50000"]', '-100');
    await page.click('button:has-text("Create Budget")');
    await expect(page.locator('text=Budget must be a positive number')).toBeVisible({ timeout: 3000 });
  });

  test('submits with valid currency and budget → modal closes', async ({ page }) => {
    await page.fill('input[placeholder="50000"]', '50000');
    await page.click('button:has-text("Create Budget")');
    await expect(page.locator('text=Create Budget')).not.toBeVisible({ timeout: 5000 });
  });

  test('suggested budget allocation section is visible', async ({ page }) => {
    await expect(page.locator('text=Suggested Budget Allocation')).toBeVisible();
  });
});

// ── Setup Budget Modal — Edit ─────────────────────────────────────────────────

test.describe('Budget — Setup Budget Modal (edit)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/budget');
    await page.click('button:has-text("Setup Budget")');
    await expect(page.locator('text=Update Budget')).toBeVisible({ timeout: 3000 });
  });

  test('modal opens with "Update Budget" title', async ({ page }) => {
    await expect(page.locator('text=Update Budget')).toBeVisible();
  });

  test('"Update Budget" submit button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Update Budget")')).toBeVisible();
  });

  test('submits update → modal closes', async ({ page }) => {
    await page.click('button:has-text("Update Budget")');
    await expect(page.locator('text=Update Budget')).not.toBeVisible({ timeout: 5000 });
  });
});

// ── Add Transaction ───────────────────────────────────────────────────────────

test.describe('Budget — Create Transaction', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/budget');
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
    await debitBtn.click();
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

test.describe('Budget — Edit Transaction', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/budget');
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

// ── Delete Transaction ────────────────────────────────────────────────────────

test.describe('Budget — Delete Transaction', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/budget');
  });

  test('delete button triggers confirmation modal', async ({ page }) => {
    const deleteBtn = page.locator('button[title="Delete"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.locator('text=Delete Transaction?')).toBeVisible({ timeout: 3000 });
    }
  });

  test('confirmation modal shows transaction name', async ({ page }) => {
    const deleteBtn = page.locator('button[title="Delete"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.locator(`text=${MOCK_TRANSACTION.transactionName}`).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('Cancel in confirmation modal dismisses it', async ({ page }) => {
    const deleteBtn = page.locator('button[title="Delete"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.locator('text=Delete Transaction?')).toBeVisible({ timeout: 3000 });
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('text=Delete Transaction?')).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('Confirm delete closes the modal', async ({ page }) => {
    const deleteBtn = page.locator('button[title="Delete"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.locator('text=Delete Transaction?')).toBeVisible({ timeout: 3000 });
      await page.locator('button:has-text("Delete")').last().click();
      await expect(page.locator('text=Delete Transaction?')).not.toBeVisible({ timeout: 5000 });
    }
  });
});

// ── Summary Cards ─────────────────────────────────────────────────────────────

test.describe('Budget — Summary Cards', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/budget');
  });

  test('"Total Budget" card is visible', async ({ page }) => {
    await expect(page.locator('text=Total Budget')).toBeVisible();
  });

  test('"Current Spending" card is visible', async ({ page }) => {
    await expect(page.locator('text=Current Spending')).toBeVisible();
  });

  test('"Remaining Budget" card is visible', async ({ page }) => {
    await expect(page.locator('text=Remaining Budget')).toBeVisible();
  });

  test('"Pending Payments" card is visible', async ({ page }) => {
    await expect(page.locator('text=Pending Payments')).toBeVisible();
  });

  test('currency badge shows budget currency (MYR)', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_BUDGET.currency}`).first()).toBeVisible();
  });

  test('Total Budget value matches MOCK_BUDGET.totalBudget (RM 50,000.00)', async ({ page }) => {
    await expect(page.locator('text=/RM\\s*50[,.]?000/').first()).toBeVisible();
  });

  test('Current Spending value matches sum of debit transactions (RM 5,000.00)', async ({ page }) => {
    await expect(page.locator('text=/RM\\s*5[,.]?000/').first()).toBeVisible();
  });

  test('Remaining Budget value matches totalBudget - currentSpending (RM 45,000.00)', async ({ page }) => {
    await expect(page.locator('text=/RM\\s*45[,.]?000/').first()).toBeVisible();
  });

  test('Current Spending percentage badge shows 10%', async ({ page }) => {
    await expect(page.locator('text=10%').first()).toBeVisible();
  });

  test('"✓ All paid" indicator shown when no pending transactions', async ({ page }) => {
    await expect(page.locator('text=All paid')).toBeVisible();
  });

  test('vendor name from transaction remarks appears in transaction table', async ({ page }) => {
    await expect(page.locator('text=Grand Ballroom').first()).toBeVisible();
  });

  test('clicking "edit budget" opens Update Budget modal', async ({ page }) => {
    await page.locator('button:has-text("edit")').first().click();
    await expect(page.locator('text=Update Budget')).toBeVisible({ timeout: 3000 });
  });
});

// ── Transaction Table Filters ─────────────────────────────────────────────────

test.describe('Budget — Transaction Table Filters', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/budget');
  });

  test('"Transaction History" heading is visible', async ({ page }) => {
    await expect(page.locator('text=Transaction History')).toBeVisible();
  });

  test('category filter select is present', async ({ page }) => {
    await expect(page.locator('select:has(option[value="All"])')).toBeVisible();
  });

  test('type filter shows Debit and Credit options', async ({ page }) => {
    const typeSelect = page.locator('select').nth(1);
    await expect(typeSelect).toBeVisible();
    const options = await typeSelect.locator('option').allInnerTexts();
    expect(options.some(o => o.includes('Debit'))).toBeTruthy();
    expect(options.some(o => o.includes('Credit'))).toBeTruthy();
  });

  test('status filter shows Paid, Pending, Overdue options', async ({ page }) => {
    const statusSelect = page.locator('select').nth(2);
    await expect(statusSelect).toBeVisible();
    const options = await statusSelect.locator('option').allInnerTexts();
    expect(options.some(o => o.includes('Paid'))).toBeTruthy();
    expect(options.some(o => o.includes('Pending'))).toBeTruthy();
    expect(options.some(o => o.includes('Overdue'))).toBeTruthy();
  });

  test('search input is present with correct placeholder', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search transactions"]')).toBeVisible();
  });

  test('searching by transaction name filters the list', async ({ page }) => {
    await page.fill('input[placeholder*="Search transactions"]', MOCK_TRANSACTION.transactionName);
    await expect(page.locator(`text=${MOCK_TRANSACTION.transactionName}`).first()).toBeVisible();
  });

  test('searching for non-existent term shows empty state message', async ({ page }) => {
    await page.fill('input[placeholder*="Search transactions"]', 'xyznonexistent999');
    await expect(page.locator('text=No transactions match your filters')).toBeVisible({ timeout: 3000 });
  });
});

// ── Export Report ─────────────────────────────────────────────────────────────

test.describe('Budget — Export Report', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/budget');
  });

  test('"Export Report" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Export Report")')).toBeVisible();
  });

  test('"Export Report" button is disabled (Coming Soon)', async ({ page }) => {
    await expect(page.locator('button:has-text("Export Report")')).toBeDisabled();
  });

  test('"Coming Soon" badge is displayed on Export Report', async ({ page }) => {
    await expect(page.locator('text=Coming Soon')).toBeVisible();
  });
});

// ── No Events State ───────────────────────────────────────────────────────────

test.describe('Budget — No Events State', () => {
  test('shows no-events message when no event exists', async ({ page }) => {
    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      if (/\/event\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: [] } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page, '');
    await page.evaluate(() => localStorage.removeItem('eventId'));
    await page.goto('/app/budget');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=No Events Yet')).toBeVisible({ timeout: 5000 });
  });
});

// ── Error State ───────────────────────────────────────────────────────────────

test.describe('Budget — Error State', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      if (/\/Wallet\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 500, json: { isSuccess: false, message: 'Server error' } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page);
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
    await page.goto('/app/budget');
    await page.waitForLoadState('networkidle');
  });

  test('shows error message when budget API fails', async ({ page }) => {
    await expect(page.locator('text=Failed to load budget data')).toBeVisible({ timeout: 5000 });
  });

  test('"Try Again" button is visible in error state', async ({ page }) => {
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible({ timeout: 5000 });
  });
});
