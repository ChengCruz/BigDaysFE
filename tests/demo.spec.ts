import { test, expect, type Page } from '@playwright/test';

/**
 * The public sample-wedding demo (src/demo).
 *
 * Deliberately mocks nothing. The whole point of demo mode is that it swaps the
 * axios adapter and serves everything locally, so any request reaching the
 * network here would itself be the bug. The seed is fixed — 14 RSVPs, 12 guest
 * rows, 32 pax, 9 parties seated, 3 needing a table, 2 declined — so the numbers
 * asserted below are exact, not ranges.
 *
 * Requires VITE_DEMO_ENABLED=true (set in .env.test). CI has no .env.test, so
 * these are local-only, like most specs in this folder.
 */

const SEEDED_TOTAL_PAX = 32;
const SEEDED_SEATED_PAX = 27;
const SEEDED_CAPACITY = 46;

/**
 * /demo sets a sessionStorage flag and hands off with window.location.replace,
 * so a plain goto() would race that redirect. Always wait for the landing page
 * to settle before navigating anywhere else.
 */
async function enterDemo(page: Page) {
  await page.goto('/demo');
  await expect(page).toHaveURL(/\/app\/guests/);
  await expect(page.getByText(/Sample wedding/i)).toBeVisible();
}

const seatsTaken = (pax: number) => `${pax} of ${SEEDED_CAPACITY} seats taken`;

/**
 * Seats the first party that has no table. Couple mode is tap-to-assign on every
 * viewport — "Pick a table" arms the picker, which turns each table card into a
 * "Seat them here" target — so this drives the same two steps on desktop and on
 * a phone, where the intermediate chrome differs.
 */
async function seatFirstUnseatedParty(page: Page) {
  await page.getByRole('button', { name: /Pick a table/i }).first().click();
  await page.getByText(/Seat them here/i).first().click();
}

test.describe('Demo mode', () => {
  test('lands a signed-out visitor in the sample wedding, no login', async ({ page }) => {
    await enterDemo(page);
    await expect(page.getByText('Aisha & Wei Ming').first()).toBeVisible();
  });

  test('shows the banner and the signup CTA', async ({ page }) => {
    await enterDemo(page);
    await expect(page.getByRole('button', { name: /Start my own wedding/i })).toBeVisible();
  });

  test('renders couple mode, not the planner sidebar', async ({ page }) => {
    await enterDemo(page);
    // Asserted on section names rather than on chrome, because CoupleShell is a
    // side rail on desktop and a bottom tab bar on mobile.
    const body = page.locator('body');
    await expect(body).toContainText('Money');
    await expect(body).toContainText('Big Day');
    // The planner sidebar's operational links are absent in either layout.
    await expect(page.getByRole('link', { name: /^Crew$/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Users$/i })).toHaveCount(0);
  });

  test('counts people as a pax sum and parties as a row count', async ({ page }) => {
    await enterDemo(page);
    const body = page.locator('body');
    // "People coming" is the one genuine head count on the page: SUM(pax).
    await expect(body).toContainText(/PEOPLE COMING/i);
    await expect(body).toContainText(String(SEEDED_TOTAL_PAX));
    // 14 RSVPs replied, of which 2 declined and so have no guest row.
    await expect(body).toContainText(/REPLIES/i);
    await expect(body).toContainText(/Not coming/i);
  });

  test('seating speaks in seats and reports capacity from the seed', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/tables/v3');
    await expect(page.getByText(seatsTaken(SEEDED_SEATED_PAX))).toBeVisible();
    // The seed puts a party of 5 on a table of 4 so this state is reachable.
    await expect(page.getByText(/Over capacity/i).first()).toBeVisible();
  });

  test('seating a party moves the seat count and survives a reload', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/tables/v3');
    await expect(page.getByText(/3 still have no table/i)).toBeVisible();

    await seatFirstUnseatedParty(page);

    // Kavitha & Suresh are 2 pax, so the seated total moves by 2, not by 1.
    // This is the assertion that would catch a row count being used for seats.
    await expect(page.getByText(seatsTaken(SEEDED_SEATED_PAX + 2))).toBeVisible();

    await page.reload();
    await expect(page.getByText(seatsTaken(SEEDED_SEATED_PAX + 2))).toBeVisible();
  });

  test('Reset restores the pristine wedding', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/tables/v3');
    await seatFirstUnseatedParty(page);
    await expect(page.getByText(seatsTaken(SEEDED_SEATED_PAX + 2))).toBeVisible();

    await page.getByRole('button', { name: /^Reset$/ }).click();
    await expect(page.getByText(seatsTaken(SEEDED_SEATED_PAX))).toBeVisible();
  });

  test('the dashboard aggregate agrees with the guests page', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/dashboard');
    // Parties, a row count: 9 of the 12 guest rows have a table.
    await expect(page.getByText(/9 of 12 parties seated/i)).toBeVisible();
    // Same head count the guests page shows, from the same seed.
    await expect(page.locator('body')).toContainText(String(SEEDED_TOTAL_PAX));
  });

  test('Money is seeded, and agrees with the dashboard on what "spent" means', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/budget');
    const body = page.locator('body');
    await expect(body).toContainText('RM 45,000.00');
    // Paid rows only, matching BudgetSummaryCards' definition of spending.
    await expect(body).toContainText('RM 16,350.00');
    // Pending is reported separately, never folded into spend.
    await expect(body).toContainText('RM 12,400.00');
  });

  test('Big Day is seeded and counts rows and pax separately', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/checkin');
    // 12 guest rows to check in, carrying 32 people between them.
    await expect(page.getByText('0 / 12')).toBeVisible();
    await expect(page.getByText(/0 \/ 32 pax/)).toBeVisible();
  });

  test('the checklist drives the readiness card', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/dashboard');
    // 4 of 10 seeded tasks done.
    await expect(page.getByText(/40% ready/i)).toBeVisible();
    await expect(page.getByText(/6 things left/i)).toBeVisible();
  });

  test('recent activity renders emoji, not raw icon names', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/dashboard');
    // Both dashboards print the `icon` field verbatim, so a name leaks as text.
    const body = page.locator('body');
    await expect(body).toContainText(/Hui Xin replied/i);
    await expect(body).not.toContainText('user-add');
  });

  test('floor plan loads the seeded layout', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/tables/floorplan');
    await expect(page.locator('body')).toContainText(
      `${SEEDED_SEATED_PAX}/${SEEDED_CAPACITY}`,
    );
    await expect(page.getByText(/STAGE/i).first()).toBeVisible();
  });
});

test.describe('Demo mode isolation', () => {
  test('does not leak into a tab that never visited /demo', async ({ page }) => {
    // Demo state lives in sessionStorage, which is per-tab, so a visitor opening
    // the app in a second tab must hit the real auth guard.
    await page.goto('/app/guests');
    await expect(page).toHaveURL(/\/login/);
  });

  test('the flag is scoped to sessionStorage, not localStorage', async ({ page }) => {
    // localStorage would outlive the tab and follow whoever uses the browser next.
    await enterDemo(page);
    expect(await page.evaluate(() => sessionStorage.getItem('bigdays.demo.v1'))).toBe('1');
    expect(await page.evaluate(() => localStorage.getItem('bigdays.demo.v1'))).toBeNull();
  });

  test('hides every control that needs an account', async ({ page }) => {
    await enterDemo(page);
    const body = page.locator('body');
    // Rail + account menu: all of these hit endpoints the adapter passes through
    // to the real backend, or end a session that was never started.
    await expect(page.getByRole('button', { name: /Switch to advanced view/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /What's new/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Get help/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Your account/i })).toHaveCount(0);
    // Colours too: a demo visitor should see the look we chose for them, and
    // with it gone the account menu has no items left, so the avatar trigger
    // is dropped rather than opening empty.
    await expect(page.getByLabel(/Account/i)).toHaveCount(0);
    await expect(body).not.toContainText(/Colours:/i);
    // And the body copy that would otherwise point at the missing switch.
    await expect(body).not.toContainText(/Switch to advanced view from your account menu/i);
  });

  test('hides the event-switcher actions that lead nowhere', async ({ page }) => {
    await enterDemo(page);
    await page.locator('[data-tour="event-switcher"] button').first().click();
    await expect(page.getByText(/Create new event/i)).toHaveCount(0);
    await expect(page.getByText(/Manage all events/i)).toHaveCount(0);
    // The one event is still listed and selectable.
    await expect(page.getByText('Aisha & Wei Ming').first()).toBeVisible();
  });

  test('the designer step asks for an account instead of dead-ending on /login', async ({ page }) => {
    // The designer must open in a new tab, and a new tab has its own
    // sessionStorage, so it could never carry the demo flag.
    await enterDemo(page);
    await expect(page.getByText(/Free account needed/i)).toBeVisible();
    await page.getByRole('button', { name: /Design invite/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('does not change the saved uiMode preference', async ({ page }) => {
    // Couple mode is forced as a default, never written, so a planner who opens
    // the demo does not come back to a switched view.
    await enterDemo(page);
    expect(await page.evaluate(() => localStorage.getItem('uiMode'))).toBeNull();
  });

  test('the CTA leaves demo mode on the way to register', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('button', { name: /Start my own wedding/i }).click();
    await expect(page).toHaveURL(/\/register/);
    expect(await page.evaluate(() => sessionStorage.getItem('bigdays.demo.v1'))).toBeNull();
    // The banner must not follow the visitor onto the signup page.
    await expect(page.getByText(/Sample wedding/i)).toHaveCount(0);
  });
});

test.describe('Demo gates', () => {
  // The demo withholds only what it cannot honestly deliver, or what is the
  // thing worth keeping. Everything else stays usable — notably the floor plan
  // itself, which is the most persuasive surface in the product and would be
  // worthless behind a blur.
  test('export asks for an account instead of downloading', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('button', { name: /Export/i }).click();
    await page.getByText(/Export as CSV/i).click();
    await expect(page.getByText(/Create a free account to export your guest list/i)).toBeVisible();
  });

  test('the export gate can be dismissed and the demo carries on', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('button', { name: /Export/i }).click();
    await page.getByText(/Export as XLSX/i).click();
    await page.getByRole('button', { name: /Keep looking around/i }).click();
    await expect(page.getByText(/Create a free account to export/i)).toHaveCount(0);
    await expect(page.getByText('Aisha & Wei Ming').first()).toBeVisible();
  });

  test('the floor plan itself stays open; only saving is gated', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/tables/floorplan');
    // The canvas renders in full — no blur, no overlay.
    await expect(page.getByText(/STAGE/i).first()).toBeVisible();
    await expect(page.getByText(/Create a free account/i)).toHaveCount(0);

    await page.getByRole('button', { name: /Save Layout/i }).click();
    await expect(page.getByText(/Create a free account to save this layout/i)).toBeVisible();
  });

  test('a gate routes to register and leaves demo mode', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('button', { name: /Export/i }).click();
    await page.getByText(/Export as CSV/i).click();
    await page.getByRole('button', { name: /Start my own wedding/i }).last().click();
    await expect(page).toHaveURL(/\/register/);
    expect(await page.evaluate(() => sessionStorage.getItem('bigdays.demo.v1'))).toBeNull();
  });
});
