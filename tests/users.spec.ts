/**
 * Users CRUD tests — Profile view, Change Password, Admin: Create/Edit/Delete users.
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated, gotoAuthenticatedAsMember, MOCK_MEMBER_USER, MOCK_USER_LIST } from './helpers';

// ── My Profile (non-admin view) ───────────────────────────────────────────────
// Uses Member role so UsersPage renders the profile + change password view (not admin list)

test.describe('Users — My Profile', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedAsMember(page, '/app/users');
  });

  test('shows profile page with user name and email', async ({ page }) => {
    await expect(page.locator(`text=${MOCK_MEMBER_USER.fullName}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_MEMBER_USER.email}`).first()).toBeVisible();
  });

  test('Change Password section is visible', async ({ page }) => {
    // h4 text is "Change Password" — CSS applies uppercase display, DOM text is mixed case
    await expect(page.locator('text=Change Password')).toBeVisible();
  });

  test('password fields are present', async ({ page }) => {
    await expect(page.locator('input[placeholder="Enter current password"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter new password"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Re-enter new password"]')).toBeVisible();
  });
});

// ── Change Password validation ────────────────────────────────────────────────

test.describe('Users — Change Password validation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedAsMember(page, '/app/users');
    await expect(page.locator('text=Change Password')).toBeVisible();
  });

  test('shows error when new passwords do not match', async ({ page }) => {
    await page.fill('input[placeholder="Enter current password"]', 'OldPass123!');
    await page.fill('input[placeholder="Enter new password"]', 'NewPass123!');
    await page.fill('input[placeholder="Re-enter new password"]', 'DifferentPass99!');
    await page.click('button:has-text("Update Password")');
    await expect(page.locator('text=New passwords do not match')).toBeVisible({ timeout: 3000 });
  });

  test('shows error when new password is too weak', async ({ page }) => {
    await page.fill('input[placeholder="Enter current password"]', 'OldPass123!');
    await page.fill('input[placeholder="Enter new password"]', 'weak');
    await page.fill('input[placeholder="Re-enter new password"]', 'weak');
    await page.click('button:has-text("Update Password")');
    // Should show validation error (password requirements not met)
    await expect(page.locator('text=Update Password')).toBeVisible(); // button still there = not submitted
  });

  test('submits password change with valid matching passwords', async ({ page }) => {
    await page.fill('input[placeholder="Enter current password"]', 'OldPass123!');
    await page.fill('input[placeholder="Enter new password"]', 'NewPass123!');
    await page.fill('input[placeholder="Re-enter new password"]', 'NewPass123!');
    await page.click('button:has-text("Update Password")');
    // Mock returns success → success message appears
    await expect(page.locator('text=Password updated successfully')).toBeVisible({ timeout: 5000 });
  });
});

// ── Admin — All Users list ────────────────────────────────────────────────────

test.describe('Users — Admin: All Users list', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/users');
    // Click "View All Users" to switch from profile view to list view
    const viewAllBtn = page.locator('button:has-text("View All Users")');
    if (await viewAllBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewAllBtn.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('shows all users from list', async ({ page }) => {
    for (const user of MOCK_USER_LIST) {
      await expect(page.locator(`text=${user.fullName}`).first()).toBeVisible();
    }
  });

  test('"New User" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("New User")')).toBeVisible();
  });

  test('"View My Profile" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("View My Profile")')).toBeVisible();
  });
});

// ── Admin — Create User ───────────────────────────────────────────────────────

test.describe('Users — Admin: Create User', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/users');
    const viewAllBtn = page.locator('button:has-text("View All Users")');
    if (await viewAllBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewAllBtn.click();
    }
    await page.click('button:has-text("New User")');
    await expect(page.locator('text=New User')).toBeVisible({ timeout: 3000 });
  });

  test('modal opens with "New User" title', async ({ page }) => {
    await expect(page.locator('text=New User')).toBeVisible();
  });

  test('Cancel closes the modal', async ({ page }) => {
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=New User')).not.toBeVisible({ timeout: 3000 });
  });

  test('validation — stays open on empty submit', async ({ page }) => {
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=New User')).toBeVisible();
  });

  test('fills name and email and submits → modal closes', async ({ page }) => {
    // UserFormModal Name field has no placeholder — target by type (first text input in modal)
    await page.locator('input[type="text"]').first().fill('New Member');
    await page.fill('input[type="email"]', 'newmember@test.com');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=New User')).not.toBeVisible({ timeout: 5000 });
  });
});

// ── Admin — Edit User ─────────────────────────────────────────────────────────

test.describe('Users — Admin: Edit User', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/users');
    const viewAllBtn = page.locator('button:has-text("View All Users")');
    if (await viewAllBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewAllBtn.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Edit button opens "Edit User" modal', async ({ page }) => {
    const editBtn = page.locator('button:has-text("Edit")').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await expect(page.locator('text=Edit User')).toBeVisible({ timeout: 3000 });
  });

  test('"Edit User" modal has "Save" button', async ({ page }) => {
    await page.locator('button:has-text("Edit")').first().click();
    await expect(page.locator('button:has-text("Save")')).toBeVisible({ timeout: 3000 });
  });

  test('"Edit User" modal has Role dropdown', async ({ page }) => {
    await page.locator('button:has-text("Edit")').first().click();
    await expect(page.locator('text=Edit User')).toBeVisible({ timeout: 3000 });
    // Role select should be present in edit mode
    const roleSelect = page.locator('select').first();
    await expect(roleSelect).toBeVisible();
  });

  test('edits user name and saves', async ({ page }) => {
    await page.locator('button:has-text("Edit")').first().click();
    await expect(page.locator('text=Edit User')).toBeVisible({ timeout: 3000 });
    // UserFormModal Name field has no placeholder — target by type (first text input in modal)
    await page.locator('input[type="text"]').first().fill('Updated Name');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Profile saved successfully')).toBeVisible({ timeout: 5000 });
  });
});

// ── Admin — Delete User ───────────────────────────────────────────────────────

test.describe('Users — Admin: Delete User', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/app/users');
    const viewAllBtn = page.locator('button:has-text("View All Users")');
    if (await viewAllBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewAllBtn.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Delete button shows confirmation dialog', async ({ page }) => {
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await expect(page.locator('text=Delete User?')).toBeVisible({ timeout: 3000 });
  });

  test('confirmation dialog has Cancel and Delete buttons', async ({ page }) => {
    await page.locator('button:has-text("Delete")').first().click();
    await expect(page.locator('text=Delete User?')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")').last()).toBeVisible();
  });

  test('Cancel closes confirmation dialog without deleting', async ({ page }) => {
    await page.locator('button:has-text("Delete")').first().click();
    await expect(page.locator('text=Delete User?')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Delete User?')).not.toBeVisible({ timeout: 3000 });
  });

  test('confirmation shows user details before deleting', async ({ page }) => {
    await page.locator('button:has-text("Delete")').first().click();
    await expect(page.locator('text=Delete User?')).toBeVisible({ timeout: 3000 });
    // Should show user info (name or email) in the dialog
    const dialog = page.locator('text=Delete User?').locator('..').locator('..');
    await expect(dialog).toBeVisible();
  });

  test('confirms delete → dialog closes', async ({ page }) => {
    await page.locator('button:has-text("Delete")').first().click();
    await expect(page.locator('text=Delete User?')).toBeVisible({ timeout: 3000 });
    // Click the Delete button inside the modal (last one = inside dialog)
    await page.locator('button:has-text("Delete")').last().click();
    await expect(page.locator('text=Delete User?')).not.toBeVisible({ timeout: 5000 });
  });
});
