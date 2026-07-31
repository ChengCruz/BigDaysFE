/**
 * RSVP Designer V3 — /app/rsvps/designer-v3
 *
 * Covers the edit → save draft → publish → public slug flow:
 *   - Draft badge shows the server-owned version and a "not live" hint.
 *   - Guest Link panel points at /rsvp/:slug (not /rsvp/submit/:token).
 *   - Save & Publish works on a never-saved design in a single click.
 *   - The slug endpoint serves the PUBLISHED design; a later draft doesn't leak.
 */
import { test, expect, type Route } from '@playwright/test';
import {
  MOCK_EVENT,
  MOCK_EVENT_GUID,
  gotoAuthenticated,
} from './helpers';

const SLUG = 'test-wedding';

/** Status text appears in both the toolbar and the footer; scope assertions to the toolbar. */
const TOOLBAR = (page: Parameters<typeof gotoAuthenticated>[0]) =>
  page.locator('[data-tour="designer-toolbar"]');

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
 *   - a publish PUT that promotes the current draft to the live version
 *
 * Mirrors the backend's publish gating: the slug endpoint serves the latest
 * published version, falling back to the latest draft only when nothing has
 * ever been published.
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
  let saveCount = 0;
  // What guests see. Null until the organiser publishes for the first time.
  let live: { version: number; headline: string } | null = null;

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

    // RSVP design GET — the designer always loads the newest version (the draft)
    if (/\/RsvpDesign\/[^/]+\/design$/i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: {
          isSuccess: true,
          data: buildDesign(currentVersion, currentHeadline, live?.version === currentVersion),
        },
      });
    }
    // RSVP design POST (save draft) — bumps version, persists a distinct headline
    if (/\/RsvpDesign\/[^/]+\/design$/i.test(url) && method === 'POST') {
      currentVersion += 1;
      saveCount += 1;
      currentHeadline = saveCount === 1 ? opts.updatedHeadline : `${opts.updatedHeadline}-${saveCount}`;
      return route.fulfill({
        status: 200,
        json: {
          isSuccess: true,
          data: buildDesign(currentVersion, currentHeadline),
        },
      });
    }
    // Publish PUT — promotes the current draft to the version guests see
    if (/\/RsvpDesign\/[^/]+\/design\/\d+\/publish$/i.test(url) && method === 'PUT') {
      live = { version: currentVersion, headline: currentHeadline };
      return route.fulfill({ status: 200, json: { isSuccess: true, data: true } });
    }
    // Public slug fetch — serves the published design, else the latest draft.
    // Shape matches the backend's EventRsvpTemplateDto: { event, rsvpDesign, questions }.
    if (/\/event\/eventRsvp\/slug\//i.test(url) && method === 'GET') {
      const served = live ?? { version: currentVersion, headline: currentHeadline };
      return route.fulfill({
        status: 200,
        json: {
          isSuccess: true,
          data: {
            event: EVENT_WITH_SLUG,
            rsvpDesign: buildDesign(served.version, served.headline, live !== null),
            questions: [],
          },
        },
      });
    }

    return route.fallback();
  });
}

test.describe('RSVP Designer V3 — save draft + public slug link', () => {
  test('shows "Draft vN · not live" badge and a slug-based Guest Link', async ({ page }) => {
    // Authenticate first (registers generic mockApi), THEN overlay V3-specific
    // routes (LIFO-last wins), THEN navigate to the designer.
    await gotoAuthenticated(page, '/app/events');
    await mockDesignerV3(page, {
      initialHeadline: 'Initial headline',
      updatedHeadline: 'SECOND-EDIT-SHOULD-APPEAR',
    });
    await page.goto('/app/rsvps/designer-v3');
    await page.waitForLoadState('networkidle');

    // Draft badge reflects server-owned version (isPublished=false → draft).
    // Scoped to the toolbar — the footer mirrors the same status text.
    await expect(TOOLBAR(page).getByText(/Draft v\d+ · not live/)).toBeVisible({ timeout: 10_000 });

    // Guest Link panel opens with a slug-based URL (not /rsvp/submit/:token)
    await page.getByRole('button', { name: /Get Link|Guest Link/ }).click();
    const linkInput = page.locator('input[readonly]').first();
    await expect(linkInput).toBeVisible({ timeout: 5_000 });
    const value = await linkInput.inputValue();
    expect(value).toMatch(new RegExp(`/rsvp/${SLUG}$`));
    expect(value).not.toMatch(/\/rsvp\/submit\//);
  });

  test('Save & Publish pushes the design live in a single click', async ({ page }) => {
    // Authenticate first (registers generic mockApi), THEN overlay V3-specific
    // routes (LIFO-last wins), THEN navigate to the designer.
    await gotoAuthenticated(page, '/app/events');
    await mockDesignerV3(page, {
      initialHeadline: 'Initial headline',
      updatedHeadline: 'SECOND-EDIT-SHOULD-APPEAR',
    });
    await page.goto('/app/rsvps/designer-v3');
    await page.waitForLoadState('networkidle');

    // One click — no "save first" error, no second click needed. Publish must use
    // the version the save just returned, not stale component state.
    await page.getByRole('button', { name: /Save & Publish/ }).click();
    await expect(TOOLBAR(page).getByText(/Published v4/)).toBeVisible({ timeout: 10_000 });

    // The guest page now renders the design that was just published
    await page.goto(`/rsvp/${SLUG}`);
    await expect(page.getByText('SECOND-EDIT-SHOULD-APPEAR')).toBeVisible({ timeout: 10_000 });
  });

  test('a draft saved after publishing does not leak to the guest page', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockDesignerV3(page, {
      initialHeadline: 'Initial headline',
      updatedHeadline: 'PUBLISHED-COPY',
    });
    await page.goto('/app/rsvps/designer-v3');
    await page.waitForLoadState('networkidle');

    // Publish v4, then keep editing and save a v5 draft
    await page.getByRole('button', { name: /Save & Publish/ }).click();
    await expect(TOOLBAR(page).getByText(/Published v4/)).toBeVisible({ timeout: 10_000 });

    // The publish toast renders top-center, over the toolbar — clear it so the
    // next click lands on the button rather than the toast.
    await page.locator('[data-rht-toaster]').evaluate((el) => el.remove());

    await page.getByRole('button', { name: /Save draft/ }).click();
    await expect(TOOLBAR(page).getByText(/Draft v5 · not live/)).toBeVisible({ timeout: 10_000 });

    // Guests still see the published v4 — the unpublished v5 edits stay private
    await page.goto(`/rsvp/${SLUG}`);
    await expect(page.getByText('PUBLISHED-COPY', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('PUBLISHED-COPY-2')).toHaveCount(0);
  });

  /**
   * The card is sized to a phone viewport, but the cap MUST be desktop-only.
   * Without the `sm:` prefix on max-width the cap also applies on a handset, so a
   * 440px phone would render a 393px column with dead space either side — the
   * opposite of mirroring the device. Guards that regression from both ends.
   *
   * The fixture's `layout.width: 0` is the retired "full" encoding, so this also
   * covers an old edge-to-edge design migrating onto the 393 default.
   */
  test('guest card caps to the device width on desktop and stays fluid on a phone', async ({ page }) => {
    await gotoAuthenticated(page, '/app/events');
    await mockDesignerV3(page, {
      initialHeadline: 'WIDTH-CHECK',
      updatedHeadline: 'unused',
    });

    await page.goto(`/rsvp/${SLUG}`);
    await expect(page.getByText('WIDTH-CHECK', { exact: true })).toBeVisible({ timeout: 10_000 });

    const card = page.getByTestId('rsvp-card');

    // Desktop — capped to the default 393px device width, centred on the backdrop
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(card).toHaveCSS('max-width', '393px');
    expect((await card.boundingBox())!.width).toBe(393);

    // Rounded corners kept, grey bezel ring (#9ca3af = rgb(156,163,175)) gone.
    // Checked here, at a width where the sm: shadow actually applies.
    await expect(card).toHaveCSS('border-radius', '40px');
    const shadow = await card.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toContain('156, 163, 175');

    // A 440px handset is below the sm: breakpoint, so it uses all 440px
    await page.setViewportSize({ width: 440, height: 956 });
    await expect(card).toHaveCSS('max-width', 'none');
    expect((await card.boundingBox())!.width).toBe(440);
  });
});
