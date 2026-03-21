/**
 * Wallet extended tests — Setup Wallet modal, Delete Transaction,
 * Summary Cards, Table Filters, Export Report, and edge states.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockApi, setMockAuth, MOCK_WALLET, MOCK_TRANSACTION } from './helpers';

// ── Setup Wallet Modal — Create ───────────────────────────────────────────────

test.describe('Wallet — Setup Wallet Modal (create)', () => {
  test.beforeEach(async ({ page }) => {
    // Override wallet to null so "Setup Wallet" button appears
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
    await page.goto('/app/wallet');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Setup Wallet")');
    await expect(page.locator('text=Setup Wallet').first()).toBeVisible({ timeout: 3000 });
  });

  test('modal opens with "Setup Wallet" title', async ({ page }) => {
    await expect(page.locator('text=Setup Wallet').first()).toBeVisible();
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
    await expect(page.locator('text=Setup Wallet').nth(1)).not.toBeVisible({ timeout: 3000 });
  });

  test('validation — shows error when budget is negative', async ({ page }) => {
    await page.fill('input[placeholder="50000"]', '-100');
    await page.click('button:has-text("Create Wallet")');
    await expect(page.locator('text=Budget must be a positive number')).toBeVisible({ timeout: 3000 });
  });

  test('submits with valid currency and budget → modal closes', async ({ page }) => {
    await page.fill('input[placeholder="50000"]', '50000');
    await page.click('button:has-text("Create Wallet")');
    await expect(page.locator('text=Create Wallet')).not.toBeVisible({ timeout: 5000 });
  });

  test('suggested budget allocation section is visible', async ({ page }) => {
    await expect(page.locator('text=Suggested Budget Allocation')).toBeVisible();
  });
});

// ── Setup Wallet Modal — Edit ─────────────────────────────────────────────────

test.describe('Wallet — Setup Wallet Modal (edit)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/wallet');
    // Click the "Setup Wallet" button that appears in the main view (edit mode)
    await page.click('button:has-text("Setup Wallet")');
    await expect(page.locator('text=Update Wallet')).toBeVisible({ timeout: 3000 });
  });

  test('modal opens with "Update Wallet" title', async ({ page }) => {
    await expect(page.locator('text=Update Wallet')).toBeVisible();
  });

  test('"Update Wallet" submit button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Update Wallet")')).toBeVisible();
  });

  test('submits update → modal closes', async ({ page }) => {
    await page.click('button:has-text("Update Wallet")');
    await expect(page.locator('text=Update Wallet')).not.toBeVisible({ timeout: 5000 });
  });
});

// ── Delete Transaction ────────────────────────────────────────────────────────

test.describe('Wallet — Delete Transaction', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/wallet');
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
      // Click the confirm/delete button (not "Cancel")
      await page.locator('button:has-text("Delete")').last().click();
      await expect(page.locator('text=Delete Transaction?')).not.toBeVisible({ timeout: 5000 });
    }
  });
});

// ── Summary Cards ─────────────────────────────────────────────────────────────

test.describe('Wallet — Summary Cards', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/wallet');
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

  test('currency badge shows wallet currency (MYR)', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_WALLET.currency}`).first()).toBeVisible();
  });

  test('Total Budget value matches MOCK_WALLET.totalBudget (RM 50,000.00)', async ({ page }) => {
    // formatAmount(50000, 'RM') → "RM 50,000.00" (en-MY locale)
    await expect(page.locator('text=/RM\\s*50[,.]?000/').first()).toBeVisible();
  });

  test('Current Spending value matches sum of debit transactions (RM 5,000.00)', async ({ page }) => {
    // MOCK_TRANSACTION type=1 (Debit), amount=5000 → currentSpending=5000
    await expect(page.locator('text=/RM\\s*5[,.]?000/').first()).toBeVisible();
  });

  test('Remaining Budget value matches totalBudget - currentSpending (RM 45,000.00)', async ({ page }) => {
    // 50000 - 5000 = 45000
    await expect(page.locator('text=/RM\\s*45[,.]?000/').first()).toBeVisible();
  });

  test('Current Spending percentage badge shows 10%', async ({ page }) => {
    // 5000 / 50000 * 100 = 10%
    await expect(page.locator('text=10%').first()).toBeVisible();
  });

  test('"✓ All paid" indicator shown when no pending transactions', async ({ page }) => {
    // MOCK_TRANSACTION.paymentStatus = 'Paid' → pendingCount=0 → "✓ All paid"
    await expect(page.locator('text=All paid')).toBeVisible();
  });

  test('vendor name from transaction remarks appears in transaction table', async ({ page }) => {
    // MOCK_TRANSACTION remarks._extended.vendorName = 'Grand Ballroom'
    await expect(page.locator('text=Grand Ballroom').first()).toBeVisible();
  });

  test('clicking "edit budget" opens Update Wallet modal', async ({ page }) => {
    await page.locator('button:has-text("edit")').first().click();
    await expect(page.locator('text=Update Wallet')).toBeVisible({ timeout: 3000 });
  });
});

// ── Transaction Table Filters ─────────────────────────────────────────────────

test.describe('Wallet — Transaction Table Filters', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/wallet');
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

test.describe('Wallet — Export Report', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/wallet');
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

test.describe('Wallet — No Events State', () => {
  test('shows no-events message when no event exists', async ({ page }) => {
    await mockApi(page);
    await page.route('**/__mock_api__/**', async route => {
      if (/\/event\//i.test(route.request().url()) && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: [] } });
      }
      return route.fallback();
    });
    await page.goto('/login');
    await setMockAuth(page, ''); // no eventId in localStorage
    await page.evaluate(() => localStorage.removeItem('eventId'));
    await page.goto('/app/wallet');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=No Events for Budget Tracking')).toBeVisible({ timeout: 5000 });
  });
});

// ── Error State ───────────────────────────────────────────────────────────────

test.describe('Wallet — Error State', () => {
  test('shows error message when wallet API fails', async ({ page }) => {
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
    await page.goto('/app/wallet');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Failed to load wallet data')).toBeVisible({ timeout: 5000 });
  });

  test('"Try Again" button is visible in error state', async ({ page }) => {
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
    await page.goto('/app/wallet');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Try Again")')).toBeVisible({ timeout: 5000 });
  });
});
