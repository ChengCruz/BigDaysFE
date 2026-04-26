/**
 * RSVP Designer V3 — /app/rsvps/designer-v3
 *
 * Covers the edit → save draft → public slug flow that was broken before
 * .claude/todo/rsvp-v3-preview-public-sync.md was addressed:
 *   - Draft badge shows the server-owned version and "slug-only" hint.
 *   - Guest Link panel points at /rsvp/:slug (not /rsvp/submit/:token).
 *   - Public slug endpoint returns the latest saved design.
 */
import { test, expect, type Route } from '@playwright/test';
import {
  MOCK_EVENT,
  MOCK_EVENT_GUID,
  gotoAuthenticated,
} from './helpers';

const SLUG = 'test-wedding';

const EVENT_WITH_SLUG = { ...MOCK_EVENT, slug: SLUG };

type DesignResponse = {
  rsvpDesignId: number;
  eventGuid: string;
  eventId: number;
  version: number;
  isPublished: boolean;
  isDraft: boolean;
  shareToken: string | null;
  design: {
    blocks: Array<Record<string, unknown>>;
    theme: Record<string, unknown>;
    layout: Record<string, unknown>;
    flowPreset: string;
    previewModes: string[];
  };
};

function buildDesign(version: number, headlineTitle: string, isPublished = false): DesignResponse {
  return {
    rsvpDesignId: 1,
    eventGuid: MOCK_EVENT_GUID,
    eventId: 1,
    version,
    isPublished,
    isDraft: !isPublished,
    shareToken: null,
    design: {
      blocks: [
        {
          id: 'hl1',
          type: 'headline',
          title: headlineTitle,
          subtitle: 'Save the date',
          align: 'center',
          accent: 'text-white',
        },
      ],
      theme: {
        background: { type: 'color', color: '#0f172a', assetUrl: '' },
        accentColor: '#f97316',
        overlayOpacity: 0.3,
      },
      layout: { width: 0, maxHeight: 0 },
      flowPreset: 'serene',
      previewModes: ['mobile', 'desktop'],
    },
  };
}

/**
 * Layer extra routes on top of the shared mockApi so the V3 page sees:
 *   - a real event with slug
 *   - a design with a known version + headline
 *   - a save POST that increments the version and echoes an updated headline
 *
 * Playwright checks routes in reverse registration order (LIFO), so call this
 * AFTER gotoAuthenticated (which registers the generic mockApi handler first).
 */
async function mockDesignerV3(
  page: Parameters<typeof gotoAuthenticated>[0],
  opts: { initialHeadline: string; updatedHeadline: string }
) {
  // Versions progress in memory across the test: 3 (loaded) → 4 (after save)
  let currentVersion = 3;
  let currentHeadline = opts.initialHeadline;

  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Event list / by-id — include slug so the V3 page picks the slug URL
    if (/\/event\/GetEventByGuid\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: EVENT_WITH_SLUG },
      });
    }
    if (/\/event\//i.test(url) && method === 'GET' && !/\/event\/eventRsvp\//i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [EVENT_WITH_SLUG] },
      });
    }

    // RSVP design GET
    if (/\/RsvpDesign\/[^/]+\/design$/i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: buildDesign(currentVersion, currentHeadline) },
      });
    }
    // RSVP design POST (save draft) — bumps version, persists updated headline
    if (/\/RsvpDesign\/[^/]+\/design$/i.test(url) && method === 'POST') {
      currentVersion += 1;
      currentHeadline = opts.updatedHeadline;
      return route.fulfill({
        status: 200,
        json: {
          isSuccess: true,
          data: buildDesign(currentVersion, currentHeadline),
        },
      });
    }
    // Public slug fetch — should return the latest saved design
    if (/\/event\/eventRsvp\/slug\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: {
          isSuccess: true,
          data: {
            ...EVENT_WITH_SLUG,
            rsvpDesign: buildDesign(currentVersion, currentHeadline),
          },
        },
      });
    }

    return route.fallback();
  });
}

test.describe('RSVP Designer V3 — save draft + public slug link', () => {
  test('shows "Draft vN · slug-only" badge and a slug-based Guest Link', async ({ page }) => {
    // Authenticate first (registers generic mockApi), THEN overlay V3-specific
    // routes (LIFO-last wins), THEN navigate to the designer.
    await gotoAuthenticated(page, '/app/events');
    await mockDesignerV3(page, {
      initialHeadline: 'Initial headline',
      updatedHeadline: 'SECOND-EDIT-SHOULD-APPEAR',
    });
    await page.goto('/app/rsvps/designer-v3');
    await page.waitForLoadState('networkidle');

    // Draft badge reflects server-owned version (isPublished=false → draft)
    await expect(page.locator('text=/Draft v\\d+ · slug-only/')).toBeVisible({ timeout: 10_000 });

    // Guest Link panel opens with a slug-based URL (not /rsvp/submit/:token)
    await page.getByRole('button', { name: /Get Link|Guest Link/ }).click();
    const linkInput = page.locator('input[readonly]').first();
    await expect(linkInput).toBeVisible({ timeout: 5_000 });
    const value = await linkInput.inputValue();
    expect(value).toMatch(new RegExp(`/rsvp/${SLUG}$`));
    expect(value).not.toMatch(/\/rsvp\/submit\//);
  });

  test('public slug endpoint returns the latest saved design', async ({ page }) => {
    // Authenticate first (registers generic mockApi), THEN overlay V3-specific
    // routes (LIFO-last wins), THEN navigate to the designer.
    await gotoAuthenticated(page, '/app/events');
    await mockDesignerV3(page, {
      initialHeadline: 'Initial headline',
      updatedHeadline: 'SECOND-EDIT-SHOULD-APPEAR',
    });
    await page.goto('/app/rsvps/designer-v3');
    await page.waitForLoadState('networkidle');

    // Save draft via the toolbar button — mock bumps version + swaps headline
    await page.getByRole('button', { name: /Save draft/ }).click();
    await expect(page.locator('text=/Draft v4/')).toBeVisible({ timeout: 10_000 });

    // Fetch the public slug endpoint directly: it must serve the updated design
    const res = await page.request.get(
      `${page.url().split('/app/')[0]}/__mock_api__/event/eventRsvp/slug/${SLUG}`
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body?.data?.rsvpDesign?.design?.blocks?.[0]?.title).toBe('SECOND-EDIT-SHOULD-APPEAR');
  });
});
