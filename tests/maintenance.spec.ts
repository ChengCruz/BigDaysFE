/**
 * Maintenance screen. While the flag file exists on the VPS, nginx answers every API
 * call with 503 {"maintenance": true}; during a container restart it answers 502/504
 * or the browser sees a network error. The app then shows a full-page screen over
 * itself, checks /health every 30 seconds and goes back to normal on its own.
 *
 * The API base is `<origin>/__mock_api__`, so the health probe is `<origin>/health`.
 */
import { test, expect as baseExpect, type Page, type Route } from '@playwright/test';
import { gotoAuthenticated } from './helpers';

// The app boots, refreshes its session and retries before the screen can show, so allow for a loaded machine.
test.use({ actionTimeout: 15_000 });
test.describe.configure({ timeout: 60_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

const HEADING = /We're updating MYBigDay$/;

/** Answers /health with `status` and counts the calls. `status` can be flipped mid-test. */
async function mockHealth(page: Page, initial: number) {
  const state = { status: initial, calls: 0 };
  await page.route('**/health', (route) => {
    state.calls += 1;
    return route.fulfill({ status: state.status, json: { status: state.status === 200 ? 'healthy' : 'down' } });
  });
  return state;
}

/** Every API call answers `status` (with the maintenance marker when `marker`), then reload. */
async function breakApi(page: Page, status: number, marker: boolean) {
  const handler = (route: Route) =>
    route.fulfill({
      status,
      json: marker ? { maintenance: true, message: "We're updating MYBigDay" } : { message: 'x' },
    });
  await page.route('**/__mock_api__/**', handler);
  await page.reload();
  return handler;
}

test.describe('Maintenance screen', () => {
  test('a 503 with the maintenance marker shows the screen', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockHealth(page, 503);
    await breakApi(page, 503, true);

    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();
    await expect(page.getByText(/We'll be back in a few minutes/)).toBeVisible();
    await expect(page.getByText(/Checking again in \d+s/)).toBeVisible();
    await expect(page.getByRole('img', { name: 'MYBigDay' }).first()).toBeVisible();
  });

  test('a 503 without the marker, while /health is fine, is an ordinary error', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    const health = await mockHealth(page, 200);
    await breakApi(page, 503, false);

    await expect.poll(() => health.calls).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: HEADING })).toHaveCount(0);
  });

  test('a 503 without the marker, while /health is down too, shows the screen', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockHealth(page, 503);
    await breakApi(page, 503, false);
    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();
  });

  test('a 502 while /health is down shows the screen', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockHealth(page, 502);
    await breakApi(page, 502, false);
    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();
  });

  test('a 504 while /health is down shows the screen', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockHealth(page, 503);
    await breakApi(page, 504, false);
    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();
  });

  test('a 502 on one call while /health is fine stays on the app', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    const health = await mockHealth(page, 200);
    await breakApi(page, 502, false);

    await expect.poll(() => health.calls).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: HEADING })).toHaveCount(0);
  });

  test('a network error while /health is down shows the screen', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockHealth(page, 503);
    await page.route('**/__mock_api__/**', (route) => route.abort('connectionrefused'));
    await page.reload();
    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();
  });

  test('a network error while /health is fine stays on the app', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    const health = await mockHealth(page, 200);
    await page.route('**/__mock_api__/**', (route) => route.abort('connectionrefused'));
    await page.reload();

    await expect.poll(() => health.calls).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: HEADING })).toHaveCount(0);
  });

  test('Try again now keeps the screen while /health is down', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    const health = await mockHealth(page, 503);
    await breakApi(page, 503, true);
    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();

    const before = health.calls;
    await page.getByRole('button', { name: 'Try again now' }).click();
    await expect.poll(() => health.calls).toBeGreaterThan(before);
    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();
  });

  test('reloading during maintenance keeps the session, and the app restores it once the API is back', async ({
    page,
  }) => {
    await gotoAuthenticated(page, '/app/events');
    const health = await mockHealth(page, 503);
    const handler = await breakApi(page, 503, true);
    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();

    // Not signed out and not sent to the login page while the API is down.
    expect(new URL(page.url()).pathname).toBe('/app/events');
    expect(await page.evaluate(() => localStorage.getItem('has_session'))).toBe('1');

    await page.unroute('**/__mock_api__/**', handler);
    health.status = 200;
    await page.getByRole('button', { name: 'Try again now' }).click();

    await expect(page.getByRole('heading', { name: HEADING })).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/app/events');
    expect(await page.evaluate(() => localStorage.getItem('has_session'))).toBe('1');
  });

  test('checks /health by itself after 30 seconds and closes the screen when it answers', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await page.clock.install();
    await page.clock.resume();
    const health = await mockHealth(page, 503);
    const handler = await breakApi(page, 503, true);
    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();

    await page.unroute('**/__mock_api__/**', handler);
    health.status = 200;
    await page.clock.runFor(31_000);

    await expect(page.getByRole('heading', { name: HEADING })).toHaveCount(0);
    expect(health.calls).toBeGreaterThan(0);
  });
});
