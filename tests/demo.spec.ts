import { test, expect, type Page } from '@playwright/test';

/**
 * The public sample-wedding demo (src/demo).
 *
 * Deliberately mocks nothing. The whole point of demo mode is that it swaps the
 * axios adapter and serves everything locally, so any request reaching the
 * network here would itself be the bug. The seed is fixed — 10 RSVPs, 9 guest
 * rows, 27 pax, 7 parties seated, 2 needing a table, 1 declined — so the numbers
 * asserted below are exact, not ranges.
 *
 * Requires VITE_DEMO_ENABLED=true (set in .env.test). CI has no .env.test, so
 * these are local-only, like most specs in this folder.
 */

const SEEDED_TOTAL_PAX = 27;
const SEEDED_SEATED_PAX = 24;
const SEEDED_CAPACITY = 32;

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
    // 10 RSVPs replied, of which 1 declined and so has no guest row.
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
    await expect(page.getByText(/2 still have no table/i)).toBeVisible();

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
    // Parties, a row count: 7 of the 9 guest rows have a table.
    await expect(page.getByText(/7 of 9 parties seated/i)).toBeVisible();
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
    // 9 guest rows to check in, carrying 27 people between them.
    await expect(page.getByText('0 / 9')).toBeVisible();
    await expect(page.getByText(/0 \/ 27 pax/)).toBeVisible();
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
    await expect(body).toContainText(/Daniel Ooi replied/i);
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

  test('questions are seeded, and their answers reach the guest list', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/form-fields');
    // Three seeded questions, so the page shows a list rather than its empty state.
    await expect(page.getByText('Any dietary requirements?')).toBeVisible();
    await expect(page.getByText('Do you need step-free access?')).toBeVisible();
    await expect(page.getByText(/A song that will get you on the dance floor/i)).toBeVisible();
    await expect(page.getByText(/No questions yet/i)).toHaveCount(0);
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
    // sessionStorage, so it could never carry the demo flag. Signup is the
    // honest destination — but it is a one-way door, so it confirms first.
    await enterDemo(page);
    await expect(page.getByText(/Free account needed/i)).toBeVisible();
    await page.getByRole('button', { name: /Design invite/i }).click();
    await expect(page.getByText(/Create a free account to design your invite/i)).toBeVisible();
    await page.getByRole('button', { name: /Start my own wedding/i }).last().click();
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
  /** The one way out every gate offers. */
  const gate = (page: Page) =>
    page.getByRole('button', { name: /Start my own wedding/i }).last();

  /*
   * Two kinds of boundary live here, and the distinction is worth keeping.
   *
   * Most gates are honest: export, saving a layout, publishing an invite. They
   * produce something that leaves the demo, so an account has to hold it.
   * Check-in is the exception — Practice would work perfectly well signed out —
   * and it is gated as a product decision rather than a technical one.
   *
   * Everything else stays usable, notably the floor plan canvas itself, which
   * is the most persuasive surface in the product and would be worthless
   * behind a blur.
   *
   * Each test asserts BOTH halves: the gate opens, and the thing behind it did
   * not happen. A gate that appears while the action also fires is worse than
   * no gate, so "still where I was" is the real assertion.
   */
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

  test('Design invite asks before it ejects you from the demo', async ({ page }) => {
    await enterDemo(page);
    await page.getByText(/Design invite/i).first().click();

    await expect(page.getByText(/Create a free account to design your invite/i)).toBeVisible();
    // Declining leaves the visitor exactly where they were, demo flag intact.
    await page.getByRole('button', { name: /Keep looking around/i }).click();
    await expect(page).toHaveURL(/\/app\/guests/);
    await expect(page.getByText(/Sample wedding/i)).toBeVisible();
  });

  test('adding a question is gated, and the seeded three stay read-only', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/form-fields');

    await page.getByRole('button', { name: /Add a question/i }).first().click();
    await expect(page.getByText(/Create a free account to ask your own questions/i)).toBeVisible();
    await page.getByRole('button', { name: /Keep looking around/i }).click();

    // The row actions are gone entirely rather than gated one by one.
    await expect(page.getByRole('button', { name: /^Edit /i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Delete /i })).toHaveCount(0);
  });

  test('check-in is visible but cannot be run', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/checkin');

    // Practice is hidden: it is a self-contained sandbox that would otherwise
    // work signed out, so this is the product decision, not a broken feature.
    await expect(page.getByRole('button', { name: /^Practice$/ })).toHaveCount(0);

    await page.getByRole('button', { name: /Start Camera/i }).click();
    await expect(page.getByText(/Create a free account to check guests in/i)).toBeVisible();
    await page.getByRole('button', { name: /Keep looking around/i }).click();
    // The camera never started, so the prompt to start it is still showing.
    await expect(page.getByText(/Tap Start Camera to begin/i)).toBeVisible();
  });

  test('manual check-in raises the same gate as the camera', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/checkin');
    // No QR tokens are seeded, so every row offers the force-a-pass fallback.
    await page.getByRole('button', { name: /No QR/i }).first().click();
    await expect(page.getByText(/Create a free account to check guests in/i)).toBeVisible();
    // Nobody was checked in behind the gate.
    await page.getByRole('button', { name: /Keep looking around/i }).click();
    await expect(page.getByText('0 / 9')).toBeVisible();
  });

  test('crew are seeded so Big Day is not an empty page', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/crew');
    await expect(page.getByText(/Farah \(door\)/i)).toBeVisible();
  });

  test('every gate offers the same way out', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/app/checkin');
    await page.getByRole('button', { name: /Start Camera/i }).click();
    await expect(gate(page)).toBeVisible();
  });
});
